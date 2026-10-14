import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function config() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").trim().replace(/\/$/, "");
  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
  let endpointHost = "自定义 API 端点";
  try { endpointHost = new URL(baseUrl).host; } catch {}
  return { apiKey, baseUrl, model, endpointHost };
}

export async function GET() {
  const { apiKey, model, endpointHost } = config();
  return NextResponse.json({
    configured: Boolean(apiKey),
    model,
    endpointHost,
    message: apiKey ? "已检测到服务端 API Key；尚未验证密钥有效性。" : "未检测到 OPENAI_API_KEY。"
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  const { apiKey, baseUrl, model } = config();
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      code: "MISSING_API_KEY",
      error: "未配置 OPENAI_API_KEY。请在 Vercel 项目的 Environment Variables 中添加后重新部署。"
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a connectivity check. Reply with exactly OK." },
          { role: "user", content: "Reply OK." }
        ],
        max_tokens: 5,
        temperature: 0
      }),
      signal: AbortSignal.timeout(20000),
      cache: "no-store"
    });

    if (!upstream.ok) {
      const details = await upstream.text();
      console.error("OpenAI connectivity test failed", upstream.status, details.slice(0, 500));
      const status = upstream.status;
      const message = status === 401 || status === 403
        ? "API 鉴权失败。请确认密钥正确、未撤销，并且有权访问该模型。"
        : status === 429
          ? "API 返回限流或额度错误。请检查 API 计费、可用额度和速率限制。"
          : status === 400
            ? "请求被模型服务拒绝。请检查 OPENAI_MODEL 和 API 端点配置。"
            : `模型服务返回 HTTP ${status}。请检查端点、网络和模型配置。`;
      return NextResponse.json({ ok: false, code: "UPSTREAM_ERROR", error: message, upstreamStatus: status }, {
        status: 502, headers: { "Cache-Control": "no-store" }
      });
    }

    const payload = await upstream.json() as { choices?: { message?: { content?: string } }[] };
    if (!payload.choices?.[0]?.message?.content) {
      return NextResponse.json({ ok: false, code: "EMPTY_RESPONSE", error: "服务已响应，但没有返回预期文本。请检查模型兼容性。" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, model, message: "OpenAI API 连接成功，服务端已收到模型响应。" }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("OpenAI connectivity request failed", error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json({
      ok: false,
      code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
      error: timedOut ? "模型请求超时（20 秒）。请稍后重试或检查 API 服务状态。" : "无法连接模型服务。请检查 OPENAI_BASE_URL、网络可达性和部署日志。"
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
