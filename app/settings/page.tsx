"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleAlert, Cloud, ExternalLink, KeyRound, LoaderCircle, RefreshCw, ShieldCheck, Wifi } from "lucide-react";

type Status = { configured: boolean; model: string; endpointHost: string; message: string };
type TestResult = { ok: boolean; message?: string; error?: string; upstreamStatus?: number };

export default function SettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loadError, setLoadError] = useState("");

  async function refreshStatus() {
    setLoadingStatus(true);
    setLoadError("");
    try {
      const response = await fetch("/api/ai-status", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "读取配置状态失败");
      setStatus(data);
      setResult(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "无法读取服务状态");
    } finally {
      setLoadingStatus(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setResult(null);
    try {
      const response = await fetch("/api/ai-status", { method: "POST", cache: "no-store" });
      const data = await response.json() as TestResult;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "无法访问测试接口。请确认部署成功后刷新页面。" });
    } finally {
      setTesting(false);
    }
  }

  useEffect(() => { void refreshStatus(); }, []);

  return <div className="mx-auto max-w-5xl space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-xs text-slate-400"><Link href="/" className="hover:text-brand">创作工作台</Link> / 系统设置</div>
        <p className="mt-5 text-[10px] font-bold tracking-[.17em] text-brand">SETTINGS · DEPLOYMENT</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">部署与 AI 连接</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">检查线上服务是否读取到服务端配置，并发送一次极短的测试请求验证模型连接。</p>
      </div>
      <button onClick={refreshStatus} disabled={loadingStatus} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loadingStatus ? "animate-spin" : ""}/>刷新状态</button>
    </div>

    {loadError && <div role="alert" className="flex gap-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800"><CircleAlert size={17} className="shrink-0"/>{loadError}</div>}

    <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-violet-50 p-3 text-brand"><Wifi size={21}/></span>
        <div className="flex-1">
          <h2 className="font-semibold">OpenAI API 连接状态</h2>
          <p className="mt-1 text-sm text-slate-500">这里只显示配置状态，不会显示或回传 API Key。</p>
        </div>
        {status && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{status.configured ? "已配置密钥" : "缺少密钥"}</span>}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">服务端密钥</p><p className="mt-2 text-sm font-semibold">{loadingStatus ? "检查中…" : status?.configured ? "已读取" : "未配置"}</p></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">模型</p><p className="mt-2 text-sm font-semibold">{status?.model || "—"}</p></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">API 端点主机</p><p className="mt-2 break-all text-sm font-semibold">{status?.endpointHost || "—"}</p></div>
      </div>
      {status && <p className="mt-4 text-sm leading-6 text-slate-600">{status.message}</p>}
      <button onClick={testConnection} disabled={testing || loadingStatus || !status?.configured} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">{testing ? <LoaderCircle size={16} className="animate-spin"/> : <ShieldCheck size={16}/>} {testing ? "正在请求模型…" : "测试真实 API 连接"}</button>
      {result && <div role={result.ok ? "status" : "alert"} className={`mt-4 flex items-start gap-2 rounded-xl border p-4 text-sm leading-6 ${result.ok ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"}`}>{result.ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0"/> : <CircleAlert size={17} className="mt-0.5 shrink-0"/>}<div><p className="font-semibold">{result.ok ? "连接测试成功" : "连接测试失败"}</p><p className="mt-1">{result.message || result.error}</p>{typeof result.upstreamStatus === "number" && <p className="mt-1 text-xs opacity-80">上游 HTTP 状态：{result.upstreamStatus}</p>}</div></div>}
    </section>

    <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-slate-100 p-3 text-slate-700"><Cloud size={20}/></span><div><h2 className="font-semibold">没有域名或服务器？</h2><p className="mt-1 text-sm text-slate-500">使用 Vercel 托管 Next.js，无需自行维护服务器。</p></div></div>
      <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
        <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">1</span><div><p className="font-semibold text-slate-800">先把代码合并到 main</p><p className="mt-1">确保包含部署修复和 AI API 路由。Vercel 的 Production Branch 通常设置为 main。</p></div></li>
        <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">2</span><div><p className="font-semibold text-slate-800">在 Vercel 添加服务端环境变量</p><p className="mt-1">进入 Project → Settings → Environment Variables，添加下方变量并选择 Production（需要时也选 Preview）。</p><div className="mt-2 rounded-lg bg-slate-50 p-3 font-mono text-xs leading-6">OPENAI_API_KEY = 你的 API Key<br/>OPENAI_BASE_URL = https://api.openai.com/v1<br/>OPENAI_MODEL = gpt-4o-mini</div><p className="mt-2 text-xs text-amber-700">不要添加 NEXT_PUBLIC_ 前缀，不要把真实密钥放进 GitHub。</p></div></li>
        <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">3</span><div><p className="font-semibold text-slate-800">重新部署</p><p className="mt-1">环境变量保存后，重新部署一次才会应用到新的构建/运行环境。</p></div></li>
        <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">4</span><div><p className="font-semibold text-slate-800">回到本页测试</p><p className="mt-1">先测试真实 API 连接，再进入“小说分析”切换到 AI API 模式，或使用 AI 剧本生成。</p></div></li>
      </ol>
      <div className="mt-5 flex flex-wrap gap-3"><a href="https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2FYE-Bai2%2FYebAI" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">导入到 Vercel<ArrowUpRight size={15}/></a><a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">OpenAI API Keys<ExternalLink size={14}/></a></div>
    </section>

    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="flex items-start gap-3"><KeyRound size={18} className="mt-0.5 shrink-0 text-amber-800"/><div><h2 className="text-sm font-semibold text-amber-950">上线前的重要提醒</h2><p className="mt-1 text-sm leading-6 text-amber-900/80">目前应用尚未具备完整的用户登录、云端项目隔离和 API 用量限制。不要把公开网址大范围分享给陌生用户；公开接口可能被他人反复调用并消耗你的 API 额度。正式开放前应补充认证、限流和用量控制。</p></div></div>
    </section>
  </div>;
}
