import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    model: process.env.OPENROUTER_MODEL?.trim() || "openrouter/auto",
    provider: "OpenRouter"
  });
}

export async function POST() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) return NextResponse.json({ ok: false, error: "尚未配置 OPENROUTER_API_KEY。" }, { status: 503 });
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000)
    });
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ ok: false, error: "OpenRouter 拒绝了此密钥，请检查密钥是否有效。" }, { status: 502 });
    }
    if (!response.ok) return NextResponse.json({ ok: false, error: `OpenRouter 检查失败（HTTP ${response.status}）。` }, { status: 502 });
    return NextResponse.json({ ok: true, message: "OpenRouter API 凭据有效，模型目录接口可访问。此测试未消耗文本生成额度。" });
  } catch {
    return NextResponse.json({ ok: false, error: "无法连接 OpenRouter，请稍后重试。" }, { status: 502 });
  }
}
