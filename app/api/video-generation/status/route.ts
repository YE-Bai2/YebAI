import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET() {
  const configured = Boolean(process.env.FAL_KEY?.trim());
  return NextResponse.json({
    configured,
    message: configured
      ? "已配置 fal.ai 密钥。点击测试按钮验证服务端是否可以访问 fal.ai。"
      : "请在 Vercel 项目环境变量中添加 FAL_KEY，然后重新部署。",
  });
}
export async function POST() {
  const key = process.env.FAL_KEY?.trim();
  if (!key) return NextResponse.json({ ok: false, error: "尚未配置 FAL_KEY。" }, { status: 503 });
  try {
    const response = await fetch("https://rest.fal.ai", {
      method: "GET",
      headers: { Authorization: `Key ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    // The REST root may not be a health endpoint; 401/403 reliably indicate a rejected credential.
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ ok: false, error: "fal.ai 拒绝了此密钥，请确认 FAL_KEY 是否正确。" }, { status: 502 });
    }
    if (response.status >= 500) return NextResponse.json({ ok: false, error: "fal.ai 服务暂时不可用，请稍后重试。" }, { status: 502 });
    return NextResponse.json({ ok: true, message: "已成功连接 fal.ai 服务域名。真正生成视频时仍会验证账户权限与额度。" });
  } catch {
    return NextResponse.json({ ok: false, error: "无法连接 fal.ai，请稍后重试。" }, { status: 502 });
  }
}
