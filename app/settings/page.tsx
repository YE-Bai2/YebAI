"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck, Wifi } from "lucide-react";

type Status = {
  configured: boolean;
  model: string;
  endpointHost: string;
  message: string;
};
type TestResult = { ok: boolean; message?: string; error?: string; upstreamStatus?: number };

export default function SettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loadError, setLoadError] = useState("");

  async function refreshStatus() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/ai-status", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "读取状态失败");
      setStatus(data);
      setResult(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "无法读取服务状态");
    } finally {
      setLoading(false);
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
      setResult({ ok: false, error: "无法访问测试接口。请确认网站已完成部署后刷新页面。" });
    } finally {
      setTesting(false);
    }
  }

  useEffect(() => { void refreshStatus(); }, []);

  return <div className="mx-auto max-w-5xl space-y-7">
    <div>
      <div className="text-xs text-slate-400"><Link href="/" className="hover:text-brand">创作工作台</Link> / 项目设置</div>
      <p className="mt-5 text-[10px] font-bold tracking-[.17em] text-brand">SETTINGS · AI CONNECTION</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">连接 OpenAI</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">这里可以检查服务器是否已配置 API Key，并发送一次真实的模型请求。页面不会显示或保存你的密钥。</p>
    </div>

    <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-violet-50 p-3 text-brand"><Wifi size={21}/></span>
        <div className="flex-1"><h2 className="font-semibold">连接状态</h2><p className="mt-1 text-sm text-slate-500">配置状态不等于密钥有效；请点击测试按钮验证真实连接。</p></div>
        {status && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{status.configured ? "已配置密钥" : "缺少密钥"}</span>}
      </div>
      {loadError && <div role="alert" className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">{loadError}</div>}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">服务端密钥</p><p className="mt-2 text-sm font-semibold">{loading ? "检查中…" : status?.configured ? "已读取" : "未配置"}</p></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">模型名称</p><p className="mt-2 text-sm font-semibold">{status?.model || "—"}</p></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">服务地址</p><p className="mt-2 break-all text-sm font-semibold">{status?.endpointHost || "—"}</p></div>
      </div>
      {status && <p className="mt-4 text-sm leading-6 text-slate-600">{status.message}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={refreshStatus} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>刷新状态</button>
        <button onClick={testConnection} disabled={testing || loading || !status?.configured} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">{testing ? <LoaderCircle size={16} className="animate-spin"/> : <ShieldCheck size={16}/>} {testing ? "正在测试真实连接…" : "测试真实 OpenAI 连接"}</button>
      </div>
      {result && <div role={result.ok ? "status" : "alert"} className={`mt-4 flex items-start gap-2 rounded-xl border p-4 text-sm leading-6 ${result.ok ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"}`}>{result.ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0"/> : <CircleAlert size={17} className="mt-0.5 shrink-0"/>}<div><p className="font-semibold">{result.ok ? "连接测试成功" : "连接测试未成功"}</p><p className="mt-1">{result.message || result.error}</p>{typeof result.upstreamStatus === "number" && <p className="mt-1 text-xs opacity-80">服务商状态码：{result.upstreamStatus}</p>}</div></div>}
    </section>

    <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <h2 className="font-semibold">只需要设置一次</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">在 Vercel 项目里添加以下环境变量。添加后重新部署，YebAI 才能读取新设置。</p>
      <ol className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
        <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">1</span><div><p className="font-semibold text-slate-800">打开 Vercel 项目设置</p><p>进入 YebAI 项目 → Settings → Environment Variables。</p><a className="mt-1 inline-flex items-center gap-1 text-brand hover:underline" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">打开 Vercel 控制台 <ExternalLink size={13}/></a></div></li>
        <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">2</span><div><p className="font-semibold text-slate-800">添加三个变量</p><div className="mt-2 rounded-lg bg-slate-50 p-3 font-mono text-xs leading-6">OPENAI_API_KEY = 你的 API Key<br/>OPENAI_BASE_URL = https://api.openai.com/v1<br/>OPENAI_MODEL = gpt-4o-mini</div><p className="mt-2 text-xs text-amber-700">API Key 是秘密信息：只填入 Vercel 的 Value 栏，不要发给我、不要放到 GitHub，也不要加 NEXT_PUBLIC_ 前缀。</p></div></li>
        <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">3</span><div><p className="font-semibold text-slate-800">选择环境并重新部署</p><p>至少选择 Production；如果要测试预览版本，也选择 Preview。保存后进入 Deployments，重新部署最新版本。</p></div></li>
        <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-brand">4</span><div><p className="font-semibold text-slate-800">回到这里测试</p><p>部署完成后刷新此页，确认“已配置密钥”，再点“测试真实 OpenAI 连接”。</p></div></li>
      </ol>
      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">创建或查看 OpenAI API Key <ExternalLink size={14}/></a>
    </section>

    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="flex items-start gap-3"><CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-800"/><div><h2 className="text-sm font-semibold text-amber-950">安全提醒</h2><p className="mt-1 text-sm leading-6 text-amber-900/80">当前仅完成连接测试，不代表完整的用户认证与用量控制已上线。测试接口有基础的临时频率限制，但正式公开给其他用户前，仍需添加可靠的登录、服务端限流和用量保护。OpenAI API 费用与 ChatGPT 订阅分开计算。</p></div></div>
    </section>
  </div>;
}
