"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, FileText, Lightbulb, LoaderCircle, Sparkles, Users } from "lucide-react";

type Analysis = { logline: string; genre: string[]; themes: string[]; characters: { name: string; role: string; motivation: string }[]; structure: { beat: string; detail: string }[]; adaptation: string[] };
const sample = "十年前，一场发生在海边小城的火灾夺走了年轻法医林雾的部分记忆。十年后，她回到故乡调查一具身份不明的遗体，发现死者手中握着一枚属于自己童年的旧纽扣。随着调查深入，所有证人都在刻意隐瞒那场火灾的真相，而林雾的导师也逐渐成为案件嫌疑人。她必须在记忆恢复之前，判断自己究竟是追查真相的人，还是被真相追捕的人。";
function splitSentences(text: string) { return text.split(/[。！？!?\n]+/).map(s=>s.trim()).filter(Boolean); }
function analyzeLocally(text: string): Analysis {
  const sentences = splitSentences(text);
  const names = [...text.matchAll(/[\u4e00-\u9fa5]{2,3}(?=是|回到|发现|必须|调查|决定|成为|开始|逐渐)/g)].map(m=>m[0]);
  const unique = [...new Set(names)].slice(0,5);
  const characterNames = unique.length ? unique : ["主角（待命名）"];
  const words = ["记忆","真相","命运","亲情","复仇","成长","信任","秘密","选择","救赎"].filter(w=>text.includes(w));
  return {
    logline: sentences.length ? sentences.slice(0,2).join("。")+"。" : "请补充故事梗概，以便整理核心冲突。",
    genre: [/(悬疑|案件|凶手|证据|调查)/.test(text)?"悬疑":"剧情",/(爱情|恋爱|心动)/.test(text)?"爱情":/(奇幻|魔法|穿越)/.test(text)?"奇幻":/(校园|青春|毕业)/.test(text)?"青春":"都市"],
    themes: words.length ? words.slice(0,4) : ["身份认同","秘密与选择"],
    characters: characterNames.map((name,i)=>({name,role:i===0?"核心人物":"关键人物",motivation:i===0?"追寻目标、克服阻碍并完成角色转变":"推动主线冲突，揭示关键信息"})),
    structure: [
      {beat:"开场钩子",detail:sentences[0]||"用一个高概念事件建立悬念"},
      {beat:"冲突升级",detail:sentences[Math.min(1,Math.max(0,sentences.length-1))]||"让主角遭遇无法回避的阻碍"},
      {beat:"中段反转",detail:"引入一条颠覆现有判断的新证据或人物秘密"},
      {beat:"阶段高潮",detail:sentences.at(-1)||"主角做出代价明确的关键选择"}
    ],
    adaptation:["开场 30 秒呈现核心谜团，避免过长背景铺陈。","每集围绕一个明确目标展开，并在结尾留下新问题。","将人物设定转化为可见行动，减少纯解释性对白。"]
  };
}
export default function NovelPage() {
  const [text,setText]=useState(sample);
  const [analysis,setAnalysis]=useState<Analysis|null>(null);
  const [busy,setBusy]=useState(false);
  const [mode,setMode]=useState<"demo"|"api">("demo");
  const [error,setError]=useState("");
  const count=useMemo(()=>text.trim().length,[text]);
  async function runAnalysis() {
    if(!text.trim()) {setError("请先粘贴小说正文或故事梗概。");return;}
    setBusy(true);setError("");setAnalysis(null);
    try {
      if(mode==="api") {
        const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
        const data=await res.json();
        if(!res.ok) throw new Error(data.error||"分析请求失败");
        setAnalysis(data.analysis as Analysis);
      } else {
        await new Promise(resolve=>setTimeout(resolve,450));
        setAnalysis(analyzeLocally(text));
      }
    } catch(e) {setError(e instanceof Error?e.message:"发生未知错误");}
    finally {setBusy(false);}
  }
  return <div className="mx-auto max-w-6xl space-y-7">
    <div><div className="flex items-center gap-2 text-xs text-slate-400"><Link href="/" className="hover:text-brand">创作工作台</Link><span>/</span><span className="text-slate-600">小说分析</span></div><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[.17em] text-brand">STAGE 01 · STORY INTELLIGENCE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">小说分析</h1><p className="mt-2 text-sm text-slate-500">提炼故事主线、人物角色与短剧改编方向。</p></div><div className="flex items-center gap-2 rounded-xl border border-line bg-white p-1"><button onClick={()=>setMode("demo")} className={`rounded-lg px-3 py-2 text-xs ${mode==="demo"?"bg-brand-soft font-semibold text-brand-dark":"text-slate-500"}`}>本地演示分析</button><button onClick={()=>setMode("api")} className={`rounded-lg px-3 py-2 text-xs ${mode==="api"?"bg-brand-soft font-semibold text-brand-dark":"text-slate-500"}`}>AI API 模式</button></div></div></div>
    <div className="grid items-start gap-5 xl:grid-cols-[.95fr_1.05fr]">
      <section className="rounded-2xl border border-line bg-white p-5 md:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold"><FileText size={17} className="text-brand"/>故事原文</div><button onClick={()=>{setText(sample);setAnalysis(null);setError("");}} className="text-xs text-brand hover:text-brand-dark">载入示例</button></div><p className="mt-1 text-xs leading-5 text-slate-500">支持粘贴小说片段、故事梗概或完整文本。当前演示不上传原文。</p><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="在这里粘贴故事内容……" className="mt-4 min-h-[300px] w-full resize-y rounded-xl border border-line bg-slate-50/70 p-4 text-sm leading-7 outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"/><div className="mt-2 flex items-center justify-between text-[11px] text-slate-400"><span>{count.toLocaleString()} 字符</span><span>建议先使用 500–5,000 字梗概测试</span></div>{error&&<p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{error}</p>}<button onClick={runAnalysis} disabled={busy||!text.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">{busy?<LoaderCircle size={16} className="animate-spin"/>:<Sparkles size={16}/>} {busy?"正在整理故事结构":mode==="api"?"调用 AI 分析":"生成演示分析"}<ArrowRight size={15}/></button><div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800"><CircleHelp size={15} className="mt-0.5 shrink-0"/>{mode==="demo"?"演示模式基于简单文本规则生成结构，不代表真实 AI 理解。":"AI API 模式需要在服务端配置 OPENAI_API_KEY；密钥不会暴露在浏览器端。"}</div></section>
      <section className="space-y-4">
        {!analysis?<div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 p-8 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand shadow-sm"><BookOpen size={24}/></div><h2 className="mt-4 text-lg font-semibold">故事洞察将在这里呈现</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">运行分析后，你将看到故事梗概、类型标签、主题、角色档案和结构节点。</p><div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2 text-left">{[{icon:Sparkles,label:"故事核心"},{icon:Users,label:"人物定位"},{icon:Lightbulb,label:"结构拆解"},{icon:ArrowRight,label:"改编建议"}].map(x=>{const I=x.icon;return <div key={x.label} className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 text-xs text-slate-500"><I size={15} className="text-brand"/>{x.label}</div>})}</div></div>:<>
          <div className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={17} className="text-brand"/>一句话故事</div><p className="mt-3 text-sm leading-7 text-slate-700">{analysis.logline}</p><div className="mt-4 flex flex-wrap gap-2">{analysis.genre.map(t=><span key={t} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">{t}</span>)}{analysis.themes.map(t=><span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{t}</span>)}</div></div>
          <div className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Users size={17} className="text-brand"/>人物定位 <span className="ml-auto text-xs font-normal text-slate-400">{analysis.characters.length} 个角色</span></div><div className="mt-3 space-y-2">{analysis.characters.map(c=><div key={c.name} className="rounded-xl bg-slate-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{c.name}</span><span className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-500">{c.role}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{c.motivation}</p></div>)}</div></div>
          <div className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Lightbulb size={17} className="text-brand"/>故事结构</div><div className="mt-4 space-y-3">{analysis.structure.map((b,i)=><div key={b.beat} className="flex gap-3"><div className="flex w-7 shrink-0 flex-col items-center"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand">{i+1}</span>{i<analysis.structure.length-1&&<span className="mt-1 h-full w-px bg-violet-100"/>}</div><div className="pb-3"><p className="text-sm font-medium">{b.beat}</p><p className="mt-1 text-xs leading-5 text-slate-500">{b.detail}</p></div></div>)}</div></div>
          <div className="rounded-2xl border border-line bg-white p-5"><h3 className="text-sm font-semibold">短剧改编建议</h3><ul className="mt-3 space-y-2">{analysis.adaptation.map(x=><li key={x} className="flex gap-2 text-xs leading-5 text-slate-600"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600"/>{x}</li>)}</ul><Link href={{pathname:"/script",query:{source:"novel"}}} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark">进入剧本创作<ArrowRight size={16}/></Link></div>
        </>}
      </section>
    </div>
  </div>;
}
