"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clapperboard, Clock3, Film, Images, Plus, Sparkles, WandSparkles, X } from "lucide-react";
import { workflowItems } from "@/lib/navigation";

const initialProjects = [
  { title: "雾中来信", genre: "悬疑 · 都市", updated: "今天 10:24", status: "剧本创作中", progress: 35, color: "from-indigo-200 via-violet-100 to-slate-100", mark: "雾" },
  { title: "夏日第七码头", genre: "青春 · 爱情", updated: "昨天 16:08", status: "分镜设计中", progress: 68, color: "from-amber-100 via-orange-50 to-rose-100", mark: "夏" },
  { title: "最后一位讲述者", genre: "奇幻 · 冒险", updated: "周一 09:42", status: "素材整理中", progress: 22, color: "from-emerald-100 via-teal-50 to-cyan-100", mark: "终" }
];

const steps = [
  { n: "01", title: "小说分析", desc: "提炼故事内核与人物关系", icon: BookOpen, href: "/novel" },
  { n: "02", title: "剧本创作", desc: "拆分集数，生成场景与对白", icon: Clapperboard, href: "/script" },
  { n: "03", title: "素材资产", desc: "建立统一的视觉素材库", icon: Images, href: "/assets" },
  { n: "04", title: "分镜设计", desc: "组织镜头、景别与运镜", icon: Film, href: "/storyboard" },
  { n: "05", title: "视频生成", desc: "把分镜转为视频片段", icon: WandSparkles, href: "/video" }
];

export default function Dashboard() {
  const [novel, setNovel] = useState("");
  const [projects, setProjects] = useState(initialProjects);
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  function createProject() {
    const title = projectName.trim();
    if (!title) { setNotice("请先输入项目名称"); return; }
    setProjects([{ title, genre: "待设置类型", updated: "刚刚", status: "项目已创建", progress: 0, color: "from-violet-100 to-indigo-50", mark: title.slice(0, 1) }, ...projects]);
    setProjectName(""); setShowCreate(false); setNotice("项目已添加到当前演示工作区");
  }

  return <div className="space-y-9">
    {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-800"><span>{notice}</span><button aria-label="关闭提示" onClick={() => setNotice("")}><X size={16}/></button></div>}
    <section className="relative overflow-hidden rounded-[28px] bg-[#211C43] p-6 text-white shadow-soft md:p-9">
      <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border border-white/10" /><div className="pointer-events-none absolute -right-2 -top-14 h-56 w-56 rounded-full border border-white/10" /><div className="pointer-events-none absolute bottom-[-100px] right-[20%] h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-violet-100"><Sparkles size={13}/> AI 短剧创作工作台</span>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight md:text-[38px]">让每一个故事，<br/>都拥有自己的影像世界。</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-violet-100/75">从小说洞察到剧本、视觉资产、分镜与视频，在一个连贯的工作流里完成短剧创作。</p>
          <div className="mt-7 flex flex-wrap gap-3"><button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#29224F] transition hover:bg-violet-50"><Plus size={17}/>创建新项目</button><a href="#workflow" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">查看创作流程<ArrowRight size={16}/></a></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm md:p-5">
          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold">从故事开始</p><p className="mt-1 text-xs text-violet-100/60">粘贴一段灵感或小说梗概</p></div><span className="rounded-lg bg-white/10 p-2 text-violet-100"><BookOpen size={17}/></span></div>
          <textarea value={novel} onChange={e => {setNovel(e.target.value); setAnalyzed(false);}} placeholder="例如：一位失去记忆的女法医，在调查一桩旧案时，发现所有证据都指向十年前失踪的自己……" className="mt-4 min-h-[126px] w-full resize-y rounded-xl border border-white/10 bg-black/15 p-3 text-sm leading-6 text-white outline-none placeholder:text-violet-100/35 focus:border-violet-300/60" />
          <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[11px] text-violet-100/50">{novel.length} 字符 · 仅本地演示</span><button onClick={() => setAnalyzed(true)} disabled={!novel.trim()} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">{analyzed ? <Check size={14}/> : <Sparkles size={14}/>} {analyzed ? "已记录演示状态" : "开始分析"} </button></div>
          {analyzed && <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs leading-5 text-violet-100">演示提示：当前尚未连接大模型。下一阶段将接入故事解析与人物关系提取服务。</p>}
        </div>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[{label:"创作项目",value:String(projects.length).padStart(2,"0"),hint:"当前工作区",icon:Clapperboard},{label:"工作流阶段",value:"05",hint:"从文本到影像",icon:Film},{label:"视觉资产",value:"—",hint:"等待素材生成",icon:Images},{label:"生成任务",value:"—",hint:"服务尚未连接",icon:Clock3}].map((s,i)=>{const Icon=s.icon; return <div key={s.label} className="rounded-2xl border border-line bg-white p-4 md:p-5"><div className="flex items-center justify-between"><span className="text-xs text-slate-500 md:text-sm">{s.label}</span><span className="rounded-xl bg-violet-50 p-2 text-brand"><Icon size={17}/></span></div><p className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</p><p className="mt-1 text-[11px] text-slate-400">{s.hint}</p></div>})}
    </section>

    <section id="workflow" className="space-y-4">
      <div className="flex items-end justify-between"><div><p className="text-xs font-semibold tracking-[.14em] text-brand">YOUR WORKFLOW</p><h2 className="mt-2 text-xl font-semibold tracking-tight">从灵感到成片</h2><p className="mt-1 text-sm text-slate-500">每一步都为下一步提供结构化素材。</p></div><span className="hidden rounded-full border border-line bg-white px-3 py-1.5 text-xs text-slate-500 sm:inline-flex">5 个创作阶段</span></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{steps.map((step,i)=>{const Icon=step.icon;return <Link href={step.href} key={step.n} className="group rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-soft"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">{step.n}</span><span className="rounded-xl bg-slate-50 p-2.5 text-slate-500 transition group-hover:bg-brand-soft group-hover:text-brand"><Icon size={19}/></span></div><h3 className="mt-5 text-sm font-semibold">{step.title}</h3><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{step.desc}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400"><span>{i===0?"故事":i===1?"文本":i===2?"视觉":i===3?"镜头":"影像"}阶段</span><ArrowRight size={14} className="transition group-hover:translate-x-1 group-hover:text-brand"/></div></Link>})}</div>
    </section>

    <section className="space-y-4">
      <div className="flex items-end justify-between"><div><h2 className="text-xl font-semibold tracking-tight">最近项目</h2><p className="mt-1 text-sm text-slate-500">继续上次的创作进度。</p></div><Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark">全部项目<ArrowRight size={15}/></Link></div>
      <div className="grid gap-4 lg:grid-cols-3">{projects.slice(0,3).map((p,i)=><article key={p.title+i} className="overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-soft"><div className={`relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br ${p.color}`}><div className="absolute h-28 w-28 rounded-full border border-white/60"/><div className="absolute h-20 w-20 rounded-full border border-white/50"/><span className="relative text-4xl font-semibold text-slate-700/70">{p.mark}</span><span className="absolute left-3 top-3 rounded-full bg-white/75 px-2.5 py-1 text-[10px] text-slate-600 backdrop-blur">{p.genre}</span><span className="absolute right-3 top-3 rounded-full bg-white/75 px-2.5 py-1 text-[10px] text-slate-600">{p.status}</span></div><div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{p.title}</h3><span className="text-xs text-slate-400">{p.progress}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{width:`${p.progress}%`}}/></div><div className="mt-3 flex items-center justify-between text-[11px] text-slate-400"><span>最近更新：{p.updated}</span><button onClick={() => setNotice(`已打开「${p.title}」的演示项目入口`)} className="font-medium text-brand hover:text-brand-dark">继续创作 →</button></div></div></article>)}</div>
    </section>

    {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onClick={e=>{if(e.target===e.currentTarget)setShowCreate(false)}}><div role="dialog" aria-modal="true" aria-labelledby="create-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 id="create-title" className="text-lg font-semibold">创建创作项目</h2><p className="mt-1 text-sm text-slate-500">先为你的故事取一个名字。</p></div><button aria-label="关闭" onClick={()=>setShowCreate(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div><label htmlFor="project-name" className="mt-5 block text-sm font-medium">项目名称</label><input id="project-name" autoFocus value={projectName} onChange={e=>setProjectName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")createProject()}} placeholder="例如：雾中来信" className="mt-2 w-full rounded-xl border border-line px-3 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"/><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setShowCreate(false)} className="rounded-xl border border-line px-4 py-2.5 text-sm hover:bg-slate-50">取消</button><button onClick={createProject} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">创建项目</button></div></div></div>}
  </div>;
}
