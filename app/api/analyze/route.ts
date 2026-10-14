import { NextResponse } from "next/server";

export const runtime = "nodejs";
const systemPrompt = `你是专业的短剧开发编辑。请分析用户提供的中文小说或故事梗概，并严格返回 JSON，不要 Markdown 代码围栏。结构为：{"analysis":{"logline":"一句话故事","genre":["类型"],"themes":["主题词"],"characters":[{"name":"角色名","role":"主角/配角/反派","motivation":"目标与动机"}],"structure":[{"beat":"结构节点","detail":"内容"}],"adaptation":["短剧改编建议"]}}。只依据原文，信息不足时明确标注待确认，不要编造原文中没有的确定事实。characters 最多 8 个，structure 4 到 7 项，adaptation 3 到 6 项。`;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ error: "请提供待分析的故事文本。" }, { status: 400 });
    if (text.length > 30000) return NextResponse.json({ error: "当前单次分析上限为 30,000 字符，请分段提交。" }, { status: 413 });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "服务端尚未配置 OPENAI_API_KEY。请在 .env.local 中设置密钥后重启服务，或切换到本地演示分析。" }, { status: 503 });
    const endpoint = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const upstream = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.4, response_format: { type: "json_object" }, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: text }] }),
      signal: AbortSignal.timeout(90000)
    });
    if (!upstream.ok) {
      const details = await upstream.text();
      console.error("Analysis provider error", upstream.status, details.slice(0, 1000));
      return NextResponse.json({ error: `模型服务请求失败（HTTP ${upstream.status}），请检查模型配置后重试。` }, { status: 502 });
    }
    const payload = await upstream.json() as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "模型未返回可用的分析结果。" }, { status: 502 });
    const parsed = JSON.parse(content) as { analysis?: unknown };
    if (!parsed.analysis || typeof parsed.analysis !== "object") return NextResponse.json({ error: "模型返回格式不符合预期，请重试。" }, { status: 502 });
    return NextResponse.json({ analysis: parsed.analysis });
  } catch (error) {
    console.error("Novel analysis request failed", error);
    return NextResponse.json({ error: "分析请求处理失败，请稍后重试。" }, { status: 500 });
  }
}
