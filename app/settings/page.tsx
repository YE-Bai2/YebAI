"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck, Video, WandSparkles } from "lucide-react";

type ProviderStatus = { configured: boolean; provider?: string; model?: string; message?: string };
type TestResult = { ok: boolean; message?: string; error?: string };
function ProviderCard({ title, description, endpoint, signup, signupLabel }: { title: string; description: string; endpoint: string; signup: string; signupLabel: string }) {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await response.json();
      setStatus(data);
    } catch {
      setStatus({ configured: false, message: "暂时无法读取连接状态，请稍后刷新。" });
    } finally { setLoading(false); }
  }
  async function test() {
    setTesting(true); setResult(null);
    try {
      const response = await fetch(endpoint, { method: "POST", cache: "no-store" });
      const data = await response.json();
      setResult({ ok: response.ok && data.ok, message: data.message || data.error || "测试未完成。" });
    } catch { setResult({ ok: false, message: "无法访问测试接口。请确认部署完成后刷新页面。" }); }
    finally { setTesting(false); }
  }
  useEffect(() => { void refresh(); }, []);
  return <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
    <div className="flex items-start gap-3"><span className="rounded-xl bg-violet-50 p-3 text-brand">{endpoint.includes("video-generation") ? <Video size={21}/> : <WandSparkles size={21}/>}</span><div className="flex-1"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div>{status && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{status.configured ? "已配置" : "待配置"}</span>}</div>
    <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">状态 / 默认模型</p><p className="mt-2 text-sm font-semibold">{loading ? "检查中…" : status?.configured ? `服务器已读取密钥 · ${status.model || "默认路由"}` : "尚未配置服务商密钥"}</p><p className="mt-2 text-sm leading-6 text-slate-600">{status?.message || "正在检查服务端配置。"}</p></div>
    <div className="mt-4 flex flex-wrap gap-3"><button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>刷新状态</button><button onClick={test} disabled={testing || loading || !status?.configured} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{testing ? <LoaderCircle size={16} className="animate-spin"/> : <ShieldCheck size={16}/>}测试连接</button><a href={signup} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold hover:bg-slate-50">{signupLabel}<ExternalLink size={14}/></a></div>
    {result && <div role={result.ok ? "status" : "alert"} className={`mt-4 flex items-start gap-2 rounded-xl border p-4 text-sm leading-6 ${result.ok ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"}`}>{result.ok ? <CheckCircle2 size={17} className="mt-1 shrink-0"/> : <CircleAlert size={17} className="mt-1 shrink-0"/>}<p>{result.message}</p></div>}
  </section>;
}

export default function SettingsPage() {
  return <div className="mx-auto max-w-4xl space-y-7">
    <div><div className="text-xs text-slate-400"><Link href="/" className="hover:text-brand">创作工作台</Link> / 项目设置</div><p className="mt-5 text-[10px] font-bold tracking-[.17em] text-brand">SETTINGS · AI PROVIDERS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">AI 服务连接</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">YebAI 使用独立的文字模型与视觉模型服务。无需创建 OpenAI API Key；分别配置下方两个服务即可启用完整创作链路。</p></div>

    <ProviderCard title="文字创作 · OpenRouter" description="用于小说分析、剧本创作、角色/场景设定、分镜设计和项目策划。可路由到多家模型，不需要 OpenAI API Key。" endpoint="/api/ai/status" signup="https://openrouter.ai/keys" signupLabel="获取 OpenRouter 密钥"/>
    <ProviderCard title="图片与视频 · fal.ai" description="用于角色/场景参考图，以及 Kling 和 MiniMax 视频生成。生成任务可能按模型、时长或分辨率收费。" endpoint="/api/video-generation/status" signup="https://fal.ai/dashboard/keys" signupLabel="获取 fal.ai 密钥"/>

    <section className="rounded-2xl border border-line bg-white p-5 md:p-6"><h2 className="font-semibold">在 Vercel 配置密钥</h2><ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li>1. 打开 <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">Vercel 控制台</a>，进入 YebAI → Settings → Environment Variables。</li><li>2. 添加 <code className="rounded bg-slate-100 px-1.5 py-0.5">OPENROUTER_API_KEY</code>（文字创作）和 <code className="rounded bg-slate-100 px-1.5 py-0.5">FAL_KEY</code>（图片/视频），各自 Value 填对应服务商的密钥。</li><li>3. 两项都选择 Production；若要测试预览版，也选择 Preview。保存后进入 Deployments，重新部署最新版本。</li><li>4. 部署完成后刷新本页，分别点击两张卡片的“测试连接”。然后到小说分析、剧本创作、素材资产、分镜设计和视频生成页面进行真实生成测试。</li></ol><p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">安全提示：密钥只放在 Vercel 的环境变量中，不要发给任何人、不要提交到 GitHub，也不要使用 NEXT_PUBLIC_ 前缀。OpenRouter 与 fal.ai 的费用/免费额度由各自账户决定。</p></section>

    <section className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5"><h2 className="font-semibold">已接入的创作环节</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{["小说分析与人物关系","分集剧本与对白","角色/场景资产卡 + 参考图","镜头拆分与视频提示词","Kling / MiniMax 视频生成","项目策划与制作计划"].map(item => <div key={item} className="rounded-xl border border-white bg-white p-3 text-sm text-slate-700">{item}</div>)}</div><Link href="/novel" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white">开始 AI 创作 →</Link></section>
  </div>;
}
