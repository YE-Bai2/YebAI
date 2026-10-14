"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clapperboard, LoaderCircle, Save, Sparkles } from "lucide-react";

type Dialogue = { character: string; line: string; direction: string };
type Scene = { heading: string; location: string; time: string; action: string; dialogue: Dialogue[] };
type Episode = { title: string; logline: string; scenes: Scene[] };
const STORAGE_KEY = "yebai-script-draft-v1";
const sample = "十年前，一场发生在海边小城的火灾夺走了年轻法医林雾的部分记忆。十年后，她回到故乡调查一具身份不明的遗体，发现死者手中握着一枚属于自己童年的旧纽扣。随着调查深入，所有证人都在刻意隐瞒那场火灾的真相，而林雾的导师也逐渐成为案件嫌疑人。她必须在记忆恢复之前，判断自己究竟是追查真相的人，还是被真相追捕的人。";
const makeId = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function ScriptGeneratePage() {
  const [story, setStory] = useState(sample);
  const [episodeCount, setEpisodeCount] = useState("3");
  const [style, setStyle] = useState("悬疑、电影感、强钩子、人物对白克制");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);

  useEffect(() => {
    try {
      const savedStory = sessionStorage.getItem("yebai-novel-source");
      if (savedStory) setStory(savedStory);
    } catch {}
  }, []);

  async function generate() {
    if (!story.trim()) { setError("请先填写故事梗概。"); return; }
    setBusy(true); setError(""); setNotice(""); setEpisodes(null);
    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story, episodeCount: Number(episodeCount), style })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "生成失败，请重试。");
      if (!Array.isArray(data.episodes) || !data.episodes.length) throw new Error("没有获取到可用的剧本分集。");
      setEpisodes(data.episodes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "发生未知错误。");
    } finally {
      setBusy(false);
    }
  }

  function saveToEditor() {
    if (!episodes?.length) return;
    const normalized = episodes.map((episode, episodeIndex) => ({
      id: makeId(),
      title: episode.title || `第 ${episodeIndex + 1} 集`,
      logline: episode.logline || "",
      scenes: episode.scenes.map((scene, sceneIndex) => ({
        id: makeId(),
        heading: scene.heading || `${episodeIndex + 1}-${sceneIndex + 1} 场`,
        location: scene.location || "待定",
        time: scene.time || "不确定",
        action: scene.action || "",
        dialogue: scene.dialogue.map(line => ({ id: makeId(), character: line.character || "待定角色", line: line.line || "", direction: line.direction || "" }))
      }))
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      window.location.href = "/script";
    } catch {
      setNotice("浏览器存储失败，请减少生成内容后重试。");
    }
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center gap-2 text-xs text-slate-400"><Link href="/script" className="hover:text-brand">剧本创作</Link><span>/</span><span className="text-slate-600">AI 初稿生成</span></div>
    <div><p className="text-[10px] font-bold tracking-[.17em] text-brand">STAGE 02 · AI SCRIPT DRAFT</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">从故事生成剧本初稿</h1><p className="mt-2 text-sm leading-6 text-slate-500">生成结果可继续在剧本编辑器中逐场修改。AI 输出是创作初稿，人物设定与剧情连续性仍需人工审核。</p></div>
    <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <label className="block text-sm font-semibold">故事梗概 / 小说片段</label>
      <textarea value={story} onChange={e=>setStory(e.target.value)} rows={8} maxLength={20000} className="mt-3 w-full resize-y rounded-xl border border-line bg-slate-50/60 p-4 text-sm leading-7 outline-none focus:border-brand focus:bg-white" placeholder="粘贴故事梗概、人物关系或小说片段……"/>
      <div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>{story.length.toLocaleString()} / 20,000 字符</span><button className="text-brand" onClick={()=>setStory(sample)}>载入示例</button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><label className="block text-xs font-medium text-slate-600">生成集数</label><select value={episodeCount} onChange={e=>setEpisodeCount(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm"><option value="1">1 集</option><option value="2">2 集</option><option value="3">3 集</option><option value="4">4 集</option><option value="5">5 集</option></select></div>
        <div><label className="block text-xs font-medium text-slate-600">风格与节奏</label><input value={style} onChange={e=>setStyle(e.target.value)} maxLength={120} className="mt-2 w-full rounded-xl border border-line px-3 py-3 text-sm outline-none focus:border-brand"/></div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>}
      <button onClick={generate} disabled={busy || !story.trim()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{busy?<LoaderCircle size={16} className="animate-spin"/>:<Sparkles size={16}/>} {busy?"正在生成分集与场次…":"生成剧本初稿"} <ArrowRight size={15}/></button>
      <p className="mt-3 text-xs leading-5 text-slate-400">需要配置服务端 OPENAI_API_KEY。模型调用在服务端完成，密钥不会发送到浏览器。生成内容会消耗模型额度。</p>
    </section>
    {episodes && <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">生成结果</h2><p className="mt-1 text-xs text-slate-500">{episodes.length} 集 · 可保存到本地编辑器继续完善</p></div><button onClick={saveToEditor} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Save size={15}/>保存并进入编辑器</button></div>
      {episodes.map((episode,index)=><article key={index} className="rounded-2xl border border-line bg-white p-5"><div className="flex items-start gap-3"><span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-brand">EP {String(index+1).padStart(2,"0")}</span><div><h3 className="text-base font-semibold">{episode.title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{episode.logline}</p></div></div><div className="mt-4 space-y-3">{episode.scenes.map((scene,sceneIndex)=><div key={sceneIndex} className="rounded-xl bg-slate-50 p-4"><h4 className="text-sm font-semibold">{scene.heading}</h4><p className="mt-1 text-xs text-slate-500">{scene.location} · {scene.time}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{scene.action}</p>{scene.dialogue.map((line,lineIndex)=><p key={lineIndex} className="mt-2 text-sm leading-6"><span className="font-semibold text-violet-800">{line.character}：</span>{line.line}{line.direction&&<span className="text-xs text-slate-400">（{line.direction}）</span>}</p>)}</div>)}</div></article>)}
      <div className="flex justify-start"><Link href="/script" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand"><ArrowLeft size={15}/>返回剧本编辑器</Link></div>
    </section>}
    <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-xs leading-5 text-slate-500"><Clapperboard size={16} className="mt-0.5 shrink-0 text-brand"/>当前版本会把生成结果保存到当前浏览器的本地草稿中，不会同步到云端账号或数据库。</div>
  </div>;
}
