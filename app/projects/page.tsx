"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { Archive, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, FileJson, HardDrive, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";

const STORAGE_KEYS = [
  "yebai-script-draft-v1",
  "yebai-visual-assets-v1",
  "yebai-storyboard-v1",
  "yebai-video-tasks-v1",
] as const;

type Snapshot = {
  format: "yebai-workspace-backup";
  version: 1;
  exportedAt: string;
  data: Partial<Record<(typeof STORAGE_KEYS)[number], unknown>>;
};

function readJson(key: string): unknown {
  const raw = localStorage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
}

function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export default function ProjectsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function refresh() {
    try {
      const scripts = readJson(STORAGE_KEYS[0]);
      const assets = readJson(STORAGE_KEYS[1]);
      const board = readJson(STORAGE_KEYS[2]);
      const tasks = readJson(STORAGE_KEYS[3]);
      const episodes = Array.isArray(scripts) ? scripts : [];
      const boardEpisodes = Array.isArray(board) ? board : [];
      const scenes = boardEpisodes.reduce((n: number, e: any) => n + (Array.isArray(e?.scenes) ? e.scenes.length : 0), 0);
      const shots = boardEpisodes.reduce((n: number, e: any) => n + (Array.isArray(e?.scenes) ? e.scenes.reduce((m: number, s: any) => m + (Array.isArray(s?.shots) ? s.shots.length : 0), 0) : 0), 0);
      setCounts({
        episodes: countArray(episodes),
        assets: countArray(assets),
        storyboardEpisodes: countArray(board),
        scenes,
        shots,
        tasks: countArray(tasks),
      });
      setError("");
    } catch {
      setError("部分本地数据无法解析。建议先导出可读取的数据，并检查浏览器存储。");
    }
  }

  function exportBackup() {
    try {
      const data: Snapshot["data"] = {};
      for (const key of STORAGE_KEYS) {
        const value = readJson(key);
        if (value !== null) data[key] = value;
      }
      const snapshot: Snapshot = { format: "yebai-workspace-backup", version: 1, exportedAt: new Date().toISOString(), data };
      downloadJson("YebAI-workspace-backup.json", snapshot);
      setNotice("工作区备份已导出。请将文件保存到安全的位置。");
      setError("");
    } catch {
      setError("备份失败：本地数据存在无法解析的内容。");
    }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("备份文件不能超过 10 MB。");
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object") throw new Error("文件格式无效。");
      const snapshot = parsed as Partial<Snapshot>;
      if (snapshot.format !== "yebai-workspace-backup" || snapshot.version !== 1 || !snapshot.data || typeof snapshot.data !== "object") {
        throw new Error("这不是受支持的 YebAI 工作区备份文件。");
      }
      const incoming = snapshot.data as Record<string, unknown>;
      for (const key of STORAGE_KEYS) {
        if (!(key in incoming)) continue;
        if (!Array.isArray(incoming[key])) throw new Error("备份中的数据结构不正确：" + key);
      }
      const shouldReplace = window.confirm("导入将覆盖备份中包含的同名本地数据。建议先导出当前备份。是否继续？");
      if (!shouldReplace) return;
      for (const key of STORAGE_KEYS) {
        if (key in incoming) localStorage.setItem(key, JSON.stringify(incoming[key]));
      }
      setNotice("备份已导入当前浏览器。刷新相关创作页面后即可读取恢复的数据。");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败，请检查备份文件。");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  function clearWorkspace() {
    if (!window.confirm("此操作会删除当前浏览器中 YebAI 的剧本、视觉资产、分镜和视频任务记录，且无法撤销。请确认已导出备份。")) return;
    try {
      for (const key of STORAGE_KEYS) localStorage.removeItem(key);
      setNotice("已清除当前浏览器中的 YebAI 工作流数据。");
      refresh();
    } catch {
      setError("清理失败：浏览器未允许访问本地存储。");
    }
  }

  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-xs text-slate-400"><Link href="/">创作工作台</Link> / 全部项目</div>
        <p className="mt-5 text-[10px] font-bold tracking-[.17em] text-brand">WORKSPACE · DATA MANAGEMENT</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">工作区与数据备份</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">查看当前浏览器保存的创作数据，并导出或恢复工作区备份。当前版本按浏览器保存数据，尚不支持云端同步或多项目隔离。</p>
      </div>
      <button onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm hover:bg-slate-50"><RefreshCw size={15}/>刷新统计</button>
    </header>

    {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/>{notice}</div>}
    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800"><ShieldAlert size={17} className="mt-0.5 shrink-0"/>{error}</div>}

    <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-violet-50 p-2.5 text-brand"><HardDrive size={20}/></span><div><h2 className="font-semibold">本地数据概览</h2><p className="mt-1 text-xs text-slate-500">统计来自当前浏览器的 localStorage，不代表云端或账号数据。</p></div></div>
      {!counts ? <div className="mt-5 rounded-xl border border-dashed border-line p-6 text-center"><p className="text-sm text-slate-500">点击“刷新统计”读取当前工作区数据。</p></div> : <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{[
        ["剧本分集", counts.episodes], ["视觉资产", counts.assets], ["分镜分集", counts.storyboardEpisodes], ["场次", counts.scenes], ["镜头", counts.shots], ["视频任务", counts.tasks]
      ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></div>)}</div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/script" className="rounded-lg border border-line px-3 py-2 text-xs font-medium hover:bg-slate-50">剧本创作</Link>
        <Link href="/assets" className="rounded-lg border border-line px-3 py-2 text-xs font-medium hover:bg-slate-50">视觉资产</Link>
        <Link href="/storyboard" className="rounded-lg border border-line px-3 py-2 text-xs font-medium hover:bg-slate-50">分镜设计</Link>
        <Link href="/video" className="rounded-lg border border-line px-3 py-2 text-xs font-medium hover:bg-slate-50">视频生成</Link>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <span className="inline-flex rounded-xl bg-violet-50 p-2.5 text-brand"><ArrowDownToLine size={20}/></span>
        <h2 className="mt-4 font-semibold">导出完整备份</h2>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">将剧本、视觉资产、分镜和视频任务记录打包为一个 JSON 文件，便于迁移或留档。</p>
        <button onClick={exportBackup} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Archive size={16}/>导出工作区备份</button>
      </div>
      <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <span className="inline-flex rounded-xl bg-slate-100 p-2.5 text-slate-700"><ArrowUpFromLine size={20}/></span>
        <h2 className="mt-4 font-semibold">从备份恢复</h2>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">选择 YebAI 工作区备份文件。导入只覆盖文件中包含的数据类别，不在备份中的类别保持不变。</p>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={importBackup} className="mt-5 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold" disabled={busy}/>
        {busy && <p className="mt-2 text-xs text-slate-500">正在校验并恢复备份……</p>}
      </div>
    </section>

    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:p-6">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-white p-2 text-amber-700"><ShieldAlert size={19}/></span><div className="flex-1"><h2 className="font-semibold text-amber-950">危险操作</h2><p className="mt-1 text-sm leading-6 text-amber-900/75">清除本地数据会删除当前浏览器的工作流草稿。该操作不影响已导出的备份文件，也不会删除其他设备上的数据。</p><button onClick={clearWorkspace} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"><Trash2 size={15}/>清除本地工作流数据</button></div></div>
    </section>

    <p className="flex items-start gap-2 text-xs leading-5 text-slate-400"><FileJson size={15} className="mt-0.5 shrink-0"/>备份文件可能包含未公开的剧本、对白和创意内容，请妥善保管。导入前请确认文件来源可信。</p>
  </div>;
}
