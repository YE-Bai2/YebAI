import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getProvider() {
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  if (openAIKey) return {
    name: "OpenAI",
    key: openAIKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    endpoint: "https://api.openai.com/v1/models"
  };
  const routerKey = process.env.OPENROUTER_API_KEY?.trim();
  if (routerKey) return {
    name: "OpenRouter",
    key: routerKey,
    model: process.env.OPENROUTER_MODEL?.trim() || "openrouter/auto",
    endpoint: "https://openrouter.ai/api/v1/models"
  };
  return null;
}

export async function GET() {
  const provider = getProvider();
  return NextResponse.json({
    configured: Boolean(provider),
    model: provider?.model || null,
    provider: provider?.name || null,
    message: provider
      ? `${provider.name} 文字创作服务已配置。可点击测试按钮验证 API 凭据。`
      : "尚未配置文字模型密钥。请添加 OPENAI_API_KEY（官方 OpenAI）或 OPENROUTER_API_KEY（OpenRouter），然后重新部署。"
  });
}

export async function POST() {
  const provider = getProvider();
  if (!provider) return NextResponse.json({
    ok: false,
    error: "尚未配置文字模型密钥。请添加 OPENAI_API_KEY 或 OPENROUTER_API_KEY。"
  }, { status: 503 });
  try {
    const response = await fetch(provider.endpoint, {
      headers: { Authorization: `Bearer ${provider.key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000)
    });
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ ok: false, error: `${provider.name} 拒绝了此密钥，请检查密钥是否有效及账户权限。` }, { status: 502 });
    }
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: `${provider.name} 检查失败（HTTP ${response.status}）。` }, { status: 502 });
    }
    return NextResponse.json({ ok: true, message: `${provider.name} API 凭据有效，模型目录接口可访问。此测试不会发起文本生成请求。` });
  } catch {
    return NextResponse.json({ ok: false, error: `无法连接 ${provider.name}，请稍后重试。` }, { status: 502 });
  }
}
