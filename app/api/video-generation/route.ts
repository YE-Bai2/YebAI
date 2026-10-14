import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODELS = {
  kling: "fal-ai/kling-video/v3/standard/text-to-video",
  minimax: "minimax/h3-max/text-to-video",
} as const;

type ModelKey = keyof typeof MODELS;
const recentRequests = new Map<string, number[]>();

function rateLimited(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const recent = (recentRequests.get(key) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 3) return true;
  recent.push(now);
  recentRequests.set(key, recent);
  return false;
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getKey() {
  return process.env.FAL_KEY?.trim();
}

export async function GET(request: NextRequest) {
  const key = getKey();
  if (!key) return apiError("服务器尚未配置 FAL_KEY。请先在 Vercel 环境变量中添加 fal.ai 密钥。", 503);

  const { searchParams } = new URL(request.url);
  const modelKey = searchParams.get("model") as ModelKey | null;
  const requestId = searchParams.get("requestId") || "";
  if (!modelKey || !(modelKey in MODELS)) return apiError("无效的模型选项。");
  if (!/^[a-zA-Z0-9_-]{8,120}$/.test(requestId)) return apiError("无效的生成任务编号。");

  const model = MODELS[modelKey];
  const root = `https://queue.fal.run/${model}/requests/${encodeURIComponent(requestId)}`;
  try {
    const statusResponse = await fetch(`${root}/status`, {
      headers: { Authorization: `Key ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const statusData = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok) {
      return apiError(statusData.detail || statusData.error || "读取生成任务状态失败。", statusResponse.status);
    }

    const status = statusData.status as string | undefined;
    if (status === "COMPLETED") {
      const resultResponse = await fetch(root, {
        headers: { Authorization: `Key ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      const resultData = await resultResponse.json().catch(() => ({}));
      if (!resultResponse.ok) return apiError(resultData.detail || "获取生成视频失败。", resultResponse.status);
      const videoUrl = resultData?.video?.url;
      if (typeof videoUrl !== "string" || !videoUrl.startsWith("https://")) {
        return apiError("模型任务已完成，但没有返回可用的视频地址。", 502);
      }
      return NextResponse.json({ status: "COMPLETED", videoUrl, fileName: resultData.video.file_name || "yebai-generated-video.mp4" });
    }
    if (status === "FAILED") {
      return NextResponse.json({ status: "FAILED", error: statusData.error || "视频生成失败，请调整提示词后重试。" });
    }
    return NextResponse.json({ status: status || "IN_PROGRESS", queuePosition: statusData.queue_position ?? null });
  } catch {
    return apiError("暂时无法连接 fal.ai，请稍后重试。", 502);
  }
}

export async function POST(request: NextRequest) {
  const key = getKey();
  if (!key) return apiError("服务器尚未配置 FAL_KEY。请先在 Vercel 环境变量中添加 fal.ai 密钥。", 503);
  if (rateLimited(request)) return apiError("提交过于频繁，请一分钟后再试。", 429);

  const body = await request.json().catch(() => null) as {
    prompt?: unknown;
    model?: unknown;
    aspectRatio?: unknown;
    duration?: unknown;
  } | null;
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const modelKey = body?.model as ModelKey;
  const aspectRatio = body?.aspectRatio;
  const duration = Number(body?.duration);

  if (prompt.length < 8) return apiError("请至少输入 8 个字符的画面描述。");
  if (prompt.length > 2500) return apiError("提示词最多 2500 个字符。");
  if (typeof modelKey !== "string" || !(modelKey in MODELS)) return apiError("请选择有效的视频模型。");
  if (!["16:9", "9:16", "1:1"].includes(String(aspectRatio))) return apiError("画面比例无效。");
  const allowedDurations = modelKey === "kling" ? [5, 10, 15] : [5, 6, 8, 10];
  if (!allowedDurations.includes(duration)) return apiError("当前模型不支持所选视频时长。");

  const model = MODELS[modelKey];
  const input = modelKey === "kling"
    ? { prompt, duration: String(duration), aspect_ratio: aspectRatio, generate_audio: true, enable_safety_checker: true }
    : { prompt, duration, aspect_ratio: aspectRatio, resolution: "768P", prompt_expansion_mode: "disabled", enable_safety_checker: true };

  try {
    const response = await fetch(`https://queue.fal.run/${model}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status === 401 || response.status === 403 ? 502 : response.status;
      const message = response.status === 401 || response.status === 403
        ? "fal.ai 密钥无效或无权限，请检查 Vercel 中的 FAL_KEY。"
        : response.status === 429
          ? "服务商当前请求较多或额度不足，请检查 fal.ai 账户余额后重试。"
          : data.detail || data.error || "提交视频生成任务失败。";
      return apiError(message, status);
    }
    if (typeof data.request_id !== "string") return apiError("服务商没有返回任务编号，请稍后重试。", 502);
    return NextResponse.json({ requestId: data.request_id, model: modelKey, status: "IN_QUEUE" }, { status: 202 });
  } catch {
    return apiError("连接 fal.ai 超时或暂时不可用，请稍后重试。", 502);
  }
}
