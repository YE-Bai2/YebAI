"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clapperboard, ExternalLink, LoaderCircle, Play, Sparkles, Video } from "lucide-react";

type ModelKey = "kling" | "minimax";
type GenerationResult = { status: string; videoUrl?: string; error?: string; queuePosition?: number | null };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function VideoPage() {
  const [prompt, setPrompt] = useState("电影级短剧镜头：雨夜的城市巷口，一位年轻女主角撑着透明雨伞停下脚步，远处霓虹灯倒映在湿润的地面上。镜头缓慢推进，人物神情克制而紧张，真实电影光影，细腻皮肤质感，画面稳定。");
  const [model, setModel] = useState<ModelKey>("kling");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [duration, setDuration] = useState("5");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [taskId, setTaskId] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    setStatus("正在提交生成任务…");
    setVideoUrl("");
    setTaskId("");
    try {
      const response = await fetch("/api/video-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, aspectRatio, duration: Number(duration) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "提交生成任务失败。");
      setTaskId(data.requestId);
      setStatus("任务已提交，AI 正在生成视频…");
      for (let i = 0; i < 90; i++) {
        await wait(4000);
        const poll = await fetch(`/api/video-generation?model=${model}&requestId=${encodeURIComponent(data.requestId)}`, { cache: "no-store" });
        const result = await poll.json() as GenerationResult;
        if (!poll.ok) throw new Error(result.error || "读取生成状态失败。");
        if (result.status === "COMPLETED" && result.videoUrl) {
          setVideoUrl(result.videoUrl);
          setStatus("生成完成");
          return;
        }
        if (result.status === "FAILED") throw new Error(result.error || "视频生成失败，请调整提示词后重试。");
        setStatus(result.status === "IN_QUEUE" ? "任务排队中，正在等待模型资源…" : "AI 正在生成视频…");
      }
      setStatus("生成仍在继续。任务编号已保留，请稍后重新查看或再次尝试。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请稍后重试。");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mx-auto max-w-5xl space-y-7">
    <div>
      <div className="text-xs text-slate-400"><Link href="/" className="hover:text-brand">创作工作台</Link> / 视频生成</div>
      <p className="mt-5 text-[10px] font-bold tracking-[.17em] text-brand">STAGE 05 · AI VIDEO LAB</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">AI 视频创作</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">无需 OpenAI API。通过 fal.ai 调用 Kling 与 MiniMax 视频模型，根据文字提示生成短视频。</p>
    </div>

    <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <div className="flex items-center gap-2"><span className="rounded-xl bg-violet-50 p-2.5 text-brand"><Clapperboard size={20}/></span><h2 className="font-semibold">生成设置</h2></div>
        <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="video-prompt">描述你想生成的镜头</label>
        <textarea id="video-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={7} maxLength={2500} className="mt-2 w-full resize-y rounded-xl border border-line bg-white p-3 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" placeholder="描述人物、动作、环境、摄影机运动、光线和画面风格…" />
        <div className="mt-1 text-right text-xs text-slate-400">{prompt.length}/2500</div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label className="block text-sm font-semibold text-slate-700" htmlFor="video-model">视频模型</label><select id="video-model" value={model} onChange={(e) => { const next = e.target.value as ModelKey; setModel(next); setDuration("5"); }} className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-sm"><option value="kling">Kling 3.0 Standard（推荐）</option><option value="minimax">MiniMax H3 Max</option></select><p className="mt-1 text-xs text-slate-400">{model === "kling" ? "支持竖屏/横屏视频与原生音频。" : "支持多种画面比例，默认 768P。"}</p></div>
          <div><label className="block text-sm font-semibold text-slate-700" htmlFor="video-ratio">画面比例</label><select id="video-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-sm"><option value="9:16">9:16 竖屏短剧</option><option value="16:9">16:9 横屏</option><option value="1:1">1:1 方形</option></select></div>
          <div><label className="block text-sm font-semibold text-slate-700" htmlFor="video-duration">视频时长</label><select id="video-duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-sm">{(model === "kling" ? [5, 10, 15] : [5, 6, 8, 10]).map((seconds) => <option key={seconds} value={seconds}>{seconds} 秒</option>)}</select></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-600">费用提醒</p><p className="mt-1 text-xs leading-5 text-slate-500">按服务商模型与时长计费。提交任务前请确认 fal.ai 账户额度。</p></div>
        </div>

        <button onClick={generate} disabled={busy || prompt.trim().length < 8} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle size={17} className="animate-spin"/> : <Sparkles size={17}/>} {busy ? "正在生成…" : "生成 AI 视频"}</button>
        {status && <div role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-violet-50 p-3 text-sm leading-6 text-violet-900"><LoaderCircle size={16} className={busy ? "mt-1 shrink-0 animate-spin" : "mt-1 shrink-0"}/><div><p>{status}</p>{taskId && <p className="mt-1 break-all text-xs opacity-70">任务编号：{taskId}</p>}</div></div>}
        {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm leading-6 text-rose-800"><AlertCircle size={17} className="mt-1 shrink-0"/><p>{error}</p></div>}
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <div className="flex items-center gap-2"><span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Video size={20}/></span><h2 className="font-semibold">生成结果</h2></div>
        {videoUrl ? <div className="mt-5 space-y-4"><video src={videoUrl} controls playsInline className="w-full rounded-xl bg-black" /><div className="flex flex-wrap gap-3"><a href={videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">打开视频 <ExternalLink size={14}/></a><a href={videoUrl} download className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold">下载视频</a></div><p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={16}/>已收到服务商返回的视频链接</p></div> : <div className="mt-5 flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center"><span className="rounded-2xl bg-white p-4 text-slate-300 shadow-sm"><Play size={26}/></span><h3 className="mt-4 text-sm font-semibold text-slate-700">视频将在这里显示</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">输入镜头描述，选择模型和比例，然后点击“生成 AI 视频”。生成可能需要几分钟。</p></div>}
        <div className="mt-4 rounded-xl border border-slate-100 p-4"><p className="text-sm font-semibold">还需要配置一次服务商</p><p className="mt-1 text-sm leading-6 text-slate-500">本页面不会向浏览器发送密钥。请在项目设置中确认 fal.ai 已连接。</p><Link href="/settings" className="mt-2 inline-flex text-sm font-semibold text-brand hover:underline">前往项目设置 →</Link></div>
      </section>
    </div>
  </div>;
}
