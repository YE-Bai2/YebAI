"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Clipboard, LoaderCircle, Sparkles, WandSparkles } from "lucide-react";

type Props = { stage: "novel" | "script" | "assets" | "storyboard" | "projects"; title: string; description: string };
const stageLabels = {
  novel: { action: "AI 分析小说", placeholder: "粘贴小说正文、故事梗概或人物设定…" },
  script: { action: "AI 生成剧本", placeholder: "输入故事创意、小说分析结果，或希望改编的章节…" },
  assets: { action: "AI 设计视觉资产", placeholder: "粘贴剧本/人物设定/场景要求，AI 将生成角色卡、场景卡和图像提示词…" },
  storyboard: { action: "AI 生成分镜", placeholder: "粘贴剧本片段或描述一个需要拆分镜头的场景…" },
  projects: { action: "AI 生成项目方案", placeholder: "描述你的短剧想法、目标观众、题材或商业目标…" }
};
export default function AICreator({ stage, title, description }: Props) {
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [content, setContent] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBusy, setImageBusy] = useState(false);

  async function generate() {
    setBusy(true); setError(""); setContent(""); setCopied(false);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, input, context })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI 创作失败。");
      setContent(data.content);
      setModel(data.model || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 创作暂时不可用。");
    } finally {
      setBusy(false);
    }
  }
  async function generateImage() {
    const prompt = imagePrompt.trim();
    if (prompt.length < 8) { setError("请先生成视觉资产设定，再输入至少 8 个字符的英文或中文图片提示词。"); return; }
    setImageBusy(true); setError(""); setImageUrl("");
    try {
      const response = await fetch("/api/ai/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "提交图片生成失败。");
      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const poll = await fetch(`/api/ai/image?requestId=${encodeURIComponent(data.requestId)}`, { cache: "no-store" });
        const result = await poll.json();
        if (!poll.ok) throw new Error(result.error || "查询图片任务失败。");
        if (result.status === "COMPLETED" && result.imageUrl) { setImageUrl(result.imageUrl); return; }
        if (result.status === "FAILED") throw new Error(result.error || "图片生成失败。");
      }
      throw new Error("图片任务仍在排队或生成中，请稍后重试。");
    } catch (e) { setError(e instanceof Error ? e.message : "图片生成失败。"); }
    finally { setImageBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(content); setCopied(true); }
    catch { setError("浏览器不允许自动复制，请手动选择结果文本复制。"); }
  }
  const config = stageLabels[stage];
  return <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm md:p-6">
    <div className="flex items-start gap-3"><span className="rounded-xl bg-violet-50 p-3 text-brand"><Sparkles size={21}/></span><div><h2 className="font-semibold">真实 AI 创作</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div></div>
    <label htmlFor="ai-input" className="mt-5 block text-sm font-semibold text-slate-700">创作素材 / 指令</label>
    <textarea id="ai-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={12000} rows={7} placeholder={config.placeholder} className="mt-2 w-full resize-y rounded-xl border border-line bg-white p-3 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/>
    <div className="mt-1 text-right text-xs text-slate-400">{input.length}/12000</div>
    <label htmlFor="ai-context" className="mt-4 block text-sm font-semibold text-slate-700">补充要求（可选）</label>
    <input id="ai-context" value={context} onChange={(e) => setContext(e.target.value)} maxLength={2000} placeholder="例如：现代都市、强反转、每集 90 秒、适合竖屏拍摄" className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/>
    <button onClick={generate} disabled={busy || input.trim().length < 8} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle size={17} className="animate-spin"/> : <WandSparkles size={17}/>} {busy ? "AI 正在创作，请稍候…" : config.action}</button>
    {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm leading-6 text-rose-800"><AlertCircle size={17} className="mt-1 shrink-0"/><p>{error}</p></div>}
    {content && <div className="mt-5 rounded-xl border border-line bg-slate-50 p-4 md:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-slate-800">AI 创作结果 · {title}</h3><p className="mt-1 text-xs text-slate-400">模型：{model}</p></div><button onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"><Clipboard size={14}/>{copied ? "已复制" : "复制结果"}</button></div><pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">{content}</pre><div className="mt-4 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 size={15}/>已收到真实模型返回结果</div></div>}
    {stage === "assets" && <div className="mt-5 rounded-xl border border-violet-100 p-4"><h3 className="font-semibold text-slate-800">生成角色 / 场景参考图</h3><p className="mt-1 text-xs leading-5 text-slate-500">先生成上方视觉资产设定，再将其中一条图片提示词粘贴到这里。图片生成由 fal.ai 提供，可能产生额外费用。</p><textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} rows={3} maxLength={2500} placeholder="粘贴 AI 输出的角色或场景图片提示词…" className="mt-3 w-full rounded-xl border border-line p-3 text-sm leading-6 outline-none focus:border-violet-400"/><button onClick={generateImage} disabled={imageBusy || imagePrompt.trim().length < 8} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 disabled:opacity-50">{imageBusy ? <LoaderCircle size={16} className="animate-spin"/> : <Sparkles size={16}/>} {imageBusy ? "正在生成参考图…" : "生成参考图（fal.ai）"}</button>{imageUrl && <div className="mt-4"><img src={imageUrl} alt="AI 生成的角色或场景参考图" className="w-full rounded-xl border border-line"/><a href={imageUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-brand hover:underline">在新页面打开图片 ↗</a></div>}</div>}
    {!content && !error && <p className="mt-3 text-xs leading-5 text-slate-400">生成结果将显示在这里。文字创作需要配置 OpenRouter 密钥；视频和图片生成需要配置 fal.ai 密钥。无需 OpenAI API Key。</p>}
  </section>;
}
