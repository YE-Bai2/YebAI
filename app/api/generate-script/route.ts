import { NextResponse } from "next/server";

export const runtime = "nodejs";

const systemPrompt = `你是专业的中文短剧编剧。根据用户提供的故事梗概，生成可直接进入编辑器继续修改的短剧分集初稿。严格返回 JSON，不要 Markdown 代码围栏。结构：{"episodes":[{"title":"第 1 集 · 标题","logline":"本集梗概与结尾钩子","scenes":[{"heading":"1-1 地点 · 内景/外景 · 时间","location":"地点","time":"日/夜/黄昏/清晨/不确定","action":"可拍摄的动作、环境和情绪变化","dialogue":[{"character":"角色名","line":"台词","direction":"表演提示"}]}]}]}。每集 2-4 场，每场 1-4 条对白；台词自然、简洁、有潜台词；每集结尾尽量形成悬念或情绪钩子。不要输出 id 字段。只依据用户给出的故事，不要把未提供的事实当成既定设定。输出中文。`;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { story?: unknown; episodeCount?: unknown; style?: unknown };
    const story = typeof body.story === "string" ? body.story.trim() : "";
    const count = Number(body.episodeCount);
    const episodeCount = Number.isFinite(count) ? Math.min(5, Math.max(1, Math.floor(count))) : 1;
    const style = typeof body.style === "string" ? body.style.slice(0, 120) : "竖屏精品短剧，节奏紧凑";
    if (!story) return NextResponse.json({ error: "请先填写故事梗概或小说片段。" }, { status: 400 });
    if (story.length > 20000) return NextResponse.json({ error: "单次生成上限为 20,000 字符，请先整理为故事梗概。" }, { status: 413 });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "服务端尚未配置 OPENAI_API_KEY，请在 .env.local 中设置后重启服务。" }, { status: 503 });
    const endpoint = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const upstream = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model, temperature: 0.7, response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `请生成 ${episodeCount} 集短剧初稿。风格要求：${style}。故事素材如下：\n\n${story}\n\n请确保 episodes 数量为 ${episodeCount}。` }
        ]
      }),
      signal: AbortSignal.timeout(90000)
    });
    if (!upstream.ok) {
      const details = await upstream.text();
      console.error("Script generation provider error", upstream.status, details.slice(0, 1000));
      return NextResponse.json({ error: `模型服务请求失败（HTTP ${upstream.status}），请检查模型配置后重试。` }, { status: 502 });
    }
    const payload = await upstream.json() as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "模型未返回可用的剧本内容。" }, { status: 502 });
    const parsed = JSON.parse(content) as { episodes?: unknown };
    if (!Array.isArray(parsed.episodes) || parsed.episodes.length === 0) {
      return NextResponse.json({ error: "模型返回格式不符合预期，请重试。" }, { status: 502 });
    }
    const episodes = parsed.episodes.slice(0, episodeCount).map((raw: any, index: number) => {
      const scenes = Array.isArray(raw?.scenes) ? raw.scenes.slice(0, 8) : [];
      return {
        title: typeof raw?.title === "string" ? raw.title.slice(0, 120) : `第 ${index + 1} 集`,
        logline: typeof raw?.logline === "string" ? raw.logline.slice(0, 1000) : "",
        scenes: scenes.map((scene: any, sceneIndex: number) => ({
          heading: typeof scene?.heading === "string" ? scene.heading.slice(0, 160) : `${index + 1}-${sceneIndex + 1} 场`,
          location: typeof scene?.location === "string" ? scene.location.slice(0, 120) : "待定",
          time: ["日", "夜", "黄昏", "清晨", "不确定"].includes(scene?.time) ? scene.time : "不确定",
          action: typeof scene?.action === "string" ? scene.action.slice(0, 4000) : "",
          dialogue: (Array.isArray(scene?.dialogue) ? scene.dialogue : []).slice(0, 8).map((line: any) => ({
            character: typeof line?.character === "string" ? line.character.slice(0, 80) : "待定角色",
            line: typeof line?.line === "string" ? line.line.slice(0, 1500) : "",
            direction: typeof line?.direction === "string" ? line.direction.slice(0, 300) : ""
          }))
        }))
      };
    });
    return NextResponse.json({ episodes });
  } catch (error) {
    console.error("Script generation request failed", error);
    return NextResponse.json({ error: "剧本生成请求处理失败，请稍后重试。" }, { status: 500 });
  }
}
