"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck, Wifi } from "lucide-react";

type Status = { configured: boolean; message: string };
export default function SettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/video-generation/status", { cache: "no-store" });
      const data = await response.json();
      setStatus(data);
    } catch {
      setStatus({ configured: false, message: "暂时无法读取连接状态，请稍后刷新。" });
    } finally {
      setLoading(false);
    }
  }
  async function testConnection() {
    setTesting(true);
    setResult(null);
    try {
      const response = await fetch("/api/video-generation/status", { method: "POST", cache: "no-store" });
      const data = await response.json();
      setResult({ ok: response.ok && data.ok, message: data.message || data.error || "测试未完成。" });
    } catch {
      setResult({ ok: false, message: "无法访问测试接口。请确认部署已完成后刷新页面。" });
    } finally {
      setTesting(false);
    }
  }
  useEffect(() => { void refresh(); }, []);

  return <div className="mx-auto max-w-4xl space-y-7">
    <div><div className="text-xs text-slate-400"><Link href="/" className="hover:text-brand">创作工作台</Link> / 项目设置</div><p className="mt-5 text-[10px] font-bold tracking-[.17em] text-brand">SETTINGS · AI PROVIDERS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">AI 服务连接</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">不使用 OpenAI 也可以创作视频。当前通过 fal.ai 统一调用 Kling 与 MiniMax 视频模型。</p></div>

    <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-violet-50 p-3 text-brand"><Wifi size={21}/></span><div className="flex-1"><h2 className="font-semibold">fal.ai 视频模型服务</h2><p className="mt-1 text-sm text-slate-500">一个 fal.ai 账户即可在本平台切换多个视频模型；具体可用模型与价格以服务商账户为准。</p></div>{status && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{status.configured ? "已配置密钥" : "待配置"}</span>}</div>
      <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">连接状态</p><p className="mt-2 text-sm font-semibold">{loading ? "检查中…" : status?.configured ? "服务器已读取 FAL_KEY" : "尚未配置 FAL_KEY"}</p><p className="mt-2 text-sm leading-6 text-slate-600">{status?.message || "正在检查服务端配置。"}</p></div>
      <div className="mt-5 flex flex-wrap gap-3"><button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>刷新状态</button><button onClick={testConnection} disabled={testing || loading || !status?.configured} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{testing ? <LoaderCircle size={16} className="animate-spin"/> : <ShieldCheck size={16}/>}测试服务连接</button></div>
      {result && <div role={result.ok ? "status" : "alert"} className={`mt-4 flex items-start gap-2 rounded-xl border p-4 text-sm leading-6 ${result.ok ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"}`}>{result.ok ? <CheckCircle2 size={17} className="mt-1 shrink-0"/> : <CircleAlert size={17} className="mt-1 shrink-0"}/><p>{result.message}</p></div>}
    </section>

    <section className="rounded-2xl border border-line bg-white p-5 md:p-6"><h2 className="font-semibold">只需要设置一次</h2><ol className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
      <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">1</span><div><p className="font-semibold text-slate-800">创建 fal.ai 账户并获取密钥</p><p>登录服务商控制台，找到 API Keys 页面，创建一个密钥。模型调用可能需要充值或购买额度。</p><a href="https://fal.ai/dashboard/keys" target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-brand hover:underline">打开 fal.ai API Keys <ExternalLink size={13}/></a></div></li>
      <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">2</span><div><p className="font-semibold text-slate-800">在 Vercel 添加环境变量</p><p>打开 YebAI 项目 → Settings → Environment Variables，变量名填写 <code className="rounded bg-slate-100 px-1.5 py-0.5">FAL_KEY</code>，Value 填入刚创建的密钥。</p><a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-brand hover:underline">打开 Vercel 控制台 <ExternalLink size={13}/></a></div></li>
      <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">3</span><div><p className="font-semibold text-slate-800">重新部署并测试</p><p>保存变量后，在 Deployments 里重新部署。部署完成后回到此页点“测试服务连接”，再进入“视频生成”页面试做第一段短片。</p></div></li>
    </ol><p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">安全提示：密钥只放在 Vercel 的环境变量中，不要发给我、不要提交到 GitHub，也不要在变量名中添加 NEXT_PUBLIC_ 前缀。生成费用由 fal.ai 账户扣除。</p></section>

    <section className="rounded-2xl border border-line bg-white p-5"><h2 className="text-sm font-semibold">本次接入范围</h2><p className="mt-2 text-sm leading-6 text-slate-600">已经为真实视频生成预留服务端任务接口和结果轮询流程。它不会把 API Key 暴露给浏览器。正式公开给大量用户前，还需要可靠的登录、持久化限流和用量控制。</p><Link href="/video" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white">打开 AI 视频创作 →</Link></section>
  </div>;
}
