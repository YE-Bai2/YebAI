import { NextResponse } from "next/server";
export const runtime = "nodejs";
const sizes = ["大特写 ECU","特写 CU","近景 MCU","中景 MS","全景 WS","远景 EWS"];
const moves = ["固定镜头","缓慢推近","缓慢拉远","横向跟拍","向左摇镜","向右摇镜","手持轻晃","俯拍","仰拍","环绕"];
export async function POST(request:Request) {
 try {
  const body=await request.json() as {scene?:Record<string,unknown>;assets?:unknown};
  const scene=body.scene;
  if(!scene||typeof scene.action!=="string"||!scene.action.trim()) return NextResponse.json({error:"请提供场次动作描述。"},{status:400});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return NextResponse.json({error:"服务端尚未配置 OPENAI_API_KEY。"},{status:503});
  const endpoint=(process.env.OPENAI_BASE_URL||"https://api.openai.com/v1").replace(/\/$/,"");
  const response=await fetch(endpoint+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},signal:AbortSignal.timeout(60000),body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4o-mini",temperature:0.55,response_format:{type:"json_object"},messages:[
   {role:"system",content:"你是专业影视分镜师。输出严格 JSON：{\"shots\":[{\"shotSize\":\"中景 MS\",\"cameraMovement\":\"固定镜头\",\"duration\":4,\"visualDescription\":\"包含主体、动作、构图、光线与连续性的可拍摄画面描述\",\"audio\":\"对白或声音设计\",\"assetIds\":[]}]}。生成 3 至 8 个有叙事连续性的镜头，先建立空间，再覆盖动作、反应与关键细节，不要凭空新增剧情。shotSize 只能为："+sizes.join("、")+"。cameraMovement 只能为："+moves.join("、")+"。duration 为 1 到 30 秒。只使用输入资产列表中存在的资产 ID。"},
   {role:"user",content:JSON.stringify({scene,assets:Array.isArray(body.assets)?body.assets.slice(0,80):[]})}
  ]})});
  if(!response.ok){console.error("Storyboard provider error",response.status,(await response.text()).slice(0,800));return NextResponse.json({error:"模型服务请求失败（HTTP "+response.status+"）。"},{status:502});}
  const payload=await response.json() as {choices?:{message?:{content?:string}}[]};
  const content=payload.choices?.[0]?.message?.content;if(!content)return NextResponse.json({error:"模型没有返回分镜数据。"},{status:502});
  const parsed=JSON.parse(content) as {shots?:Record<string,unknown>[]};if(!Array.isArray(parsed.shots)||!parsed.shots.length)return NextResponse.json({error:"模型返回的镜头列表为空。"},{status:502});
  const validIds=new Set((Array.isArray(body.assets)?body.assets:[]).map(a=>a&&typeof a==="object"&&"id" in a?String((a as {id:unknown}).id):""));
  const shots=parsed.shots.slice(0,8).map(s=>({shotSize:sizes.includes(String(s.shotSize))?String(s.shotSize):"中景 MS",cameraMovement:moves.includes(String(s.cameraMovement))?String(s.cameraMovement):"固定镜头",duration:Math.max(1,Math.min(30,Number(s.duration)||4)),visualDescription:typeof s.visualDescription==="string"?s.visualDescription.slice(0,1600):"",audio:typeof s.audio==="string"?s.audio.slice(0,500):"",assetIds:Array.isArray(s.assetIds)?s.assetIds.map(String).filter(id=>validIds.has(id)).slice(0,20):[]}));
  return NextResponse.json({shots});
 } catch(error) {console.error("Storyboard generation failed",error);return NextResponse.json({error:"AI 拆镜请求失败，请稍后重试。"},{status:500});}
}