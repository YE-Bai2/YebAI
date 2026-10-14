"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, CircleHelp, Film, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { primaryItems, settingsItem, workflowItems } from "@/lib/navigation";

function NavLink({ item, active }: { item: (typeof primaryItems)[number]; active: boolean }) {
  const Icon = item.icon;
  return <Link href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-brand-soft font-semibold text-brand-dark" : "text-slate-600 hover:bg-slate-100 hover:text-ink"}`}>
    <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
    {item.href === "/projects" && <span className="ml-auto rounded-md bg-white px-1.5 py-0.5 text-[10px] text-slate-500">NEW</span>}
  </Link>;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeTitle = [...primaryItems, ...workflowItems, settingsItem].find(item => item.href === pathname)?.label ?? "创作工作台";
  return <div className="min-h-screen bg-canvas md:flex">
    <aside className="z-20 flex w-full flex-col border-b border-line bg-white px-4 py-4 md:fixed md:inset-y-0 md:w-[248px] md:border-b-0 md:border-r md:px-5 md:py-6">
      <Link href="/" className="mb-5 flex items-center gap-3 px-1 md:mb-10">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white shadow-soft"><Film size={21} /></span>
        <span><span className="block text-lg font-bold tracking-tight">YebAI</span><span className="block text-[10px] tracking-[.19em] text-slate-400">STORY STUDIO</span></span>
      </Link>
      <div className="mb-2 px-3 text-[10px] font-bold tracking-[.16em] text-slate-400">WORKSPACE</div>
      <nav className="grid grid-cols-2 gap-1 md:flex md:flex-col">
        {primaryItems.map(item => <NavLink key={item.href} item={item} active={pathname === item.href} />)}
      </nav>
      <div className="mb-2 mt-7 hidden px-3 text-[10px] font-bold tracking-[.16em] text-slate-400 md:block">PRODUCTION PIPELINE</div>
      <nav className="hidden gap-1 md:flex md:flex-col">
        {workflowItems.map(item => <NavLink key={item.href} item={item} active={pathname === item.href} />)}
      </nav>
      <div className="mt-1 grid grid-cols-2 gap-1 md:hidden">
        {workflowItems.map(item => <NavLink key={item.href} item={item} active={pathname === item.href} />)}
      </div>
      <div className="mt-auto hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 md:block">
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-brand shadow-sm"><Sparkles size={16} /></div>
        <p className="text-sm font-semibold">创作灵感加速器</p><p className="mt-1 text-xs leading-5 text-slate-500">把故事想法，变成可制作的短剧方案。</p>
        <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] text-violet-600">AI 工作流 · 演示版</span>
      </div>
      <Link href={settingsItem.href} className={`mt-3 hidden items-center gap-3 rounded-xl px-3 py-2.5 text-sm md:flex ${pathname === settingsItem.href ? "bg-brand-soft text-brand-dark" : "text-slate-600 hover:bg-slate-100"}`}><settingsItem.icon size={18} />{settingsItem.label}</Link>
    </aside>
    <div className="min-w-0 flex-1 md:ml-[248px]">
      <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-line bg-white/90 px-5 backdrop-blur md:px-9">
        <div className="flex items-center gap-2 text-sm"><span className="text-slate-400">YebAI</span><span className="text-slate-300">/</span><span className="font-semibold">{activeTitle}</span></div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-slate-500 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />演示模式</span>
          <button aria-label="帮助" className="hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 sm:block"><CircleHelp size={18} /></button>
          <button aria-label="通知" className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" /></button>
          <span className="h-8 w-px bg-line" />
          <button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-bold text-white">Y</span><span className="hidden text-left sm:block"><span className="block text-xs font-semibold">创作空间</span><span className="block text-[10px] text-slate-400">个人工作区</span></span><ChevronDown size={14} className="hidden text-slate-400 sm:block" /></button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] p-5 md:p-9">{children}</main>
      <footer className="px-5 pb-6 text-center text-[11px] text-slate-400 md:px-9">YebAI Story Studio · 第一阶段工程骨架 · AI 服务暂未接入</footer>
    </div>
  </div>;
}
