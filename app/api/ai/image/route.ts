import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MODEL = "fal-ai/flux/dev";
const recentRequests = new Map<string, number[]>();
function rateLimited(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (recentRequests.get(key) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 3) return true;
  recent.push(now);
  recentRequests.set(key, recent);
  return false;
}

export async function POST(request: NextRequest) {
  if (rateLimited(request)) return NextResponse.json({ error: "图片生成请求过于频繁，请一分钟后再试。" }, { status: 429 });
  const key = process.env.FAL_KEY?.trim();
  if (!key) return NextResponse.json({ error: "尚未配置 FAL_KEY。请在 Vercel 添加 fal.ai 密钥。" }, { status: 503 });
  const body = await request.json().catch(() => null) as { prompt?: unknown } | null;
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (prompt.length < 8 || prompt.length > 2500) {
    return NextResponse.json({ error: "图片提示词需为 8 至 2500 个字符。" }, { status: 400 });
  }
  try {
    const response = await fetch(`https://queue.fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        image_size: { width: 768, height: 1024 },
        num_images: 1,
        enable_safety_checker: true
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = response.status === 401 || response.status === 403
        ? "fal.ai 密钥无效或无图片模型权限。"
        : response.status === 429
          ? "fal.ai 请求过多或额度不足，请检查账户余额。"
          : data.detail || data.error || "提交图片生成任务失败。";
      return NextResponse.json({ error: message }, { status: response.status === 401 || response.status === 403 ? 502 : response.status });
    }
    if (typeof data.request_id !== "string") return NextResponse.json({ error: "服务商未返回任务编号。" }, { status: 502 });
    return NextResponse.json({ requestId: data.request_id, status: "IN_QUEUE" }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "无法连接 fal.ai 图片服务，请稍后重试。" }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const key = process.env.FAL_KEY?.trim();
  if (!key) return NextResponse.json({ error: "尚未配置 FAL_KEY。" }, { status: 503 });
  const requestId = new URL(request.url).searchParams.get("requestId") || "";
  if (!/^[a-zA-Z0-9_-]{8,120}$/.test(requestId)) return NextResponse.json({ error: "无效的图片任务编号。" }, { status: 400 });
  const root = `https://queue.fal.run/${MODEL}/requests/${encodeURIComponent(requestId)}`;
  try {
    const statusResponse = await fetch(`${root}/status`, { headers: { Authorization: `Key ${key}` }, cache: "no-store", signal: AbortSignal.timeout(12_000) });
    const statusData = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok) return NextResponse.json({ error: statusData.detail || "查询图片任务失败。" }, { status: statusResponse.status });
    if (statusData.status === "FAILED") return NextResponse.json({ status: "FAILED", error: statusData.error || "图片生成失败。" });
    if (statusData.status !== "COMPLETED") return NextResponse.json({ status: statusData.status || "IN_PROGRESS" });
    const resultResponse = await fetch(root, { headers: { Authorization: `Key ${key}` }, cache: "no-store", signal: AbortSignal.timeout(12_000) });
    const resultData = await resultResponse.json().catch(() => ({}));
    const imageUrl = resultData?.images?.[0]?.url;
    if (!resultResponse.ok || typeof imageUrl !== "string" || !imageUrl.startsWith("https://")) {
      return NextResponse.json({ error: "模型未返回有效图片地址。" }, { status: 502 });
    }
    return NextResponse.json({ status: "COMPLETED", imageUrl });
  } catch {
    return NextResponse.json({ error: "查询图片任务时连接 fal.ai 失败。" }, { status: 502 });
  }
}
