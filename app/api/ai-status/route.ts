import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const attempts = new Map<string, { count: number; resetAt: number }>();

function readConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").trim().replace(/\/+$/, "");
  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
  let endpointHost = "无效的 API 地址";
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") endpointHost = parsed.host;
  } catch {}
  return { apiKey, baseUrl, model, endpointHost };
}

function rateLimited(request: Request) {
  // Best-effort per-instance guard. Production apps should add durable rate limiting and authentication.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || "unknown";
  const now = Date.now();
  const existing = attempts.get(key);
  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  existing.count += 1;
  return existing.count > 5;
}

export async function GET() {
  const { apiKey, model, endpointHost } = readConfig();
  return NextResponse.json({
    configured: Boolean(apiKey),
    model,
    endpointHost,
    message: apiKey ? "已读取服务端密钥配置；尚未验证密钥是否有效。" : "尚未配置 OPENAI_API_KEY。"
  }, { headers: noStore });
}

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return NextResponse.json({
      ok: false,
      code: "RATE_LIMITED",
      error: "测试次数过多，请一分钟后再试。"
    }, { status: 429, headers: noStore });
  }

  const { apiKey, baseUrl, model, endpointHost } = readConfig();
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      code: "MISSING_API_KEY",
      error: "还没有配置 OpenAI API Key。请在 Vercel 项目设置中添加 OPENAI_API_KEY，然后重新部署。"
    }, { status: 503, headers: noStore });
  }

  if (endpointHost === "无效的 API 地址") {
    return NextResponse.json({
      ok: false,
      code: "INVALID_BASE_URL",
      error: "OPENAI_BASE_URL 格式无效。请使用 https://api.openai.com/v1，或确认自定义兼容端点地址。"
    }, { status: 400, headers: noStore });
  }

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a connectivity check. Reply with exactly OK." },
          { role: "user", content: "Reply OK." }
        ],
        max_tokens: 5,
        temperature: 0
      }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store"
    });

    if (!upstream.ok) {
      const status = upstream.status;
      // Do not return upstream response bodies or credentials to the browser.
      console.error("AI connection test failed with upstream HTTP status", status);
      const error = status === 401 || status === 403
        ? "密钥验证失败。请检查 API Key 是否复制完整、有效且未被撤销。"
        : status === 429
          ? "OpenAI 返回限流或额度错误。请检查 API 账单、可用额度和速率限制。"
          : status === 400
            ? "模型服务拒绝了请求。请检查模型名称是否正确，以及该模型是否可用。"
            : `模型服务返回错误（HTTP ${status}）。请检查端点配置并稍后重试。`;
      return NextResponse.json({ ok: false, code: "UPSTREAM_ERROR", error, upstreamStatus: status }, {
        status: 502, headers: noStore
      });
    }

    const payload = await upstream.json() as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({
        ok: false,
        code: "EMPTY_RESPONSE",
        error: "模型服务已响应，但没有返回测试文本。请检查模型兼容性。"
      }, { status: 502, headers: noStore });
    }

    return NextResponse.json({
      ok: true,
      model,
      message: "OpenAI 连接成功！YebAI 已从模型服务收到真实响应。"
    }, { headers: noStore });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error("AI connection test failed", timedOut ? "timeout" : "network error");
    return NextResponse.json({
      ok: false,
      code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
      error: timedOut
        ? "连接测试超过 20 秒未完成。请稍后重试。"
        : "无法连接模型服务。请检查 OPENAI_BASE_URL 和部署日志。"
    }, { status: 502, headers: noStore });
  }
}
