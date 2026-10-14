import {NextResponse} from "next/server";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const body=await request.json() as Record<string,unknown>;
  const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
  const shotId=typeof body.shotId==="string"?body.shotId.slice(0,160):"";
  const model=typeof body.model==="string"?body.model.trim().slice(0,100):"default";
  const duration=Number(body.duration),ratio=typeof body.ratio==="string"?body.ratio:"9:16";
  if(!prompt||prompt.length>12000)return NextResponse.json({error:"提示词不能为空且不得超过 12,000 字符。"},{status:400});
  if(!shotId)return NextResponse.json({error:"缺少分镜 ID。"},{status:400});
  if(!Number.isFinite(duration)||duration<1||duration>30)return NextResponse.json({error:"视频时长必须在 1 到 30 秒之间。"},{status:400});
  if(!["9:16","16:9","1:1"].includes(ratio))return NextResponse.json({error:"不支持的画面比例。"},{status:400});
  const endpoint=process.env.VIDEO_API_ENDPOINT;
  const key=process.env.VIDEO_API_KEY;
  if(!endpoint||!key)return NextResponse.json({error:"尚未配置 VIDEO_API_ENDPOINT 与 VIDEO_API_KEY。演示任务不需要调用此接口。请先配置兼容 YebAI 视频适配协议的供应商端点。"},{status:503});
  const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},body:JSON.stringify({model,prompt,duration,aspect_ratio:ratio,metadata:{shot_id:shotId,episode_title:typeof body.episodeTitle==="string"?body.episodeTitle.slice(0,200):"",scene_title:typeof body.sceneTitle==="string"?body.sceneTitle.slice(0,200):""}}),signal:AbortSignal.timeout(60000)});
  if(!response.ok){console.error("Video provider error",response.status,(await response.text()).slice(0,800));return NextResponse.json({error:"视频供应商请求失败（HTTP "+response.status+"）。"},{status:502});}
  const data=await response.json() as Record<string,unknown>;
  const taskId=typeof data.task_id==="string"?data.task_id:typeof data.id==="string"?data.id:"";
  const status=typeof data.status==="string"?data.status:"queued";
  const videoUrl=typeof data.video_url==="string"?data.video_url:typeof data.output_url==="string"?data.output_url:"";
  if(!taskId)return NextResponse.json({error:"供应商响应缺少 task_id 或 id，请检查适配协议。"},{status:502});
  return NextResponse.json({taskId,status,videoUrl:videoUrl||undefined});
 }catch(error){console.error("Video task submission failed",error);return NextResponse.json({error:"视频任务提交失败，请稍后重试。"},{status:500});}
}