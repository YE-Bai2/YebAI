import { NextResponse } from "next/server";

export const runtime = "nodejs";

const kindNames: Record<string,string> = { character:"角色", scene:"场景", prop:"道具", costume:"服装" };

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const kind = typeof body.kind === "string" ? body.kind : "";
    const name = typeof body.name === "string" ? body.name.trim().slice(0,120) : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const style = typeof body.style === "string" ? body.style.slice(0,240) : "写实电影感";
    const ratio = typeof body.ratio === "string" ? body.ratio : "3:4";
    const negativePrompt = typeof body.negativePrompt === "string" ? body.negativePrompt.slice(0,1000) : "";
    if (!kindNames[kind]) return NextResponse.json({error:"素材类型不正确。"}, {status:400});
    if (!name || !description) return NextResponse.json({error:"请填写素材名称和设定描述。"}, {status:400});
    if (description.length > 5000) return NextResponse.json({error:"描述最多 5,000 字符。"}, {status:413});
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({error:"服务端尚未配置 OPENAI_API_KEY。"}, {status:503});
    const endpoint = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const upstream = await fetch(`${endpoint}/chat/completions`, {
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`},
      body:JSON.stringify({
        model,temperature:0.65,response_format:{type:"json_object"},
        messages:[
          {role:"system",content:`你是影视美术指导与生成式图像提示词工程师。用中文输出严格 JSON：{"description":"精炼且可视觉化的资产设定","prompt":"可直接用于图像模型的完整提示词","negativePrompt":"反向提示词"}。资产类型为${kindNames[kind]}。突出可视化细节、镜头/光线、材质、构图和影视概念设计质量。角色设计优先强调正面全身设定、清晰轮廓、服装细节和角色辨识度；场景优先强调空间布局、光源、纵深和气氛；道具优先强调外形、材质、磨损和关键细节；服装优先强调剪裁、面料、层次和配色。避免文字、水印、无关人物和相互矛盾的细节。不要声称已经生成图片。`},
          {role:"user",content:JSON.stringify({kind:kindNames[kind],name,description,style,ratio,negativePrompt})}
        ]
      }),
      signal:AbortSignal.timeout(60000)
    });
    if(!upstream.ok){console.error("Asset prompt provider error",upstream.status,(await upstream.text()).slice(0,800));return NextResponse.json({error:`模型服务请求失败（HTTP ${upstream.status}）。`},{status:502});}
    const payload=await upstream.json() as {choices?:{message?:{content?:string}}[]};
    const content=payload.choices?.[0]?.message?.content;
    if(!content)return NextResponse.json({error:"模型没有返回提示词。"},{status:502});
    const parsed=JSON.parse(content) as Record<string,unknown>;
    return NextResponse.json({
      description:typeof parsed.description==="string"?parsed.description.slice(0,5000):description,
      prompt:typeof parsed.prompt==="string"?parsed.prompt.slice(0,8000):"",
      negativePrompt:typeof parsed.negativePrompt==="string"?parsed.negativePrompt.slice(0,1000):negativePrompt
    });
  } catch(error) {
    console.error("Asset prompt request failed",error);
    return NextResponse.json({error:"提示词优化请求失败，请稍后重试。"},{status:500});
  }
}
