import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleDashed, Clapperboard, Film, Images, Settings2, WandSparkles, FolderKanban } from "lucide-react";
import { workflowItems, primaryItems, settingsItem } from "@/lib/navigation";

const pageDetails: Record<string, { eyebrow: string; title: string; description: string; next: string; nextLabel: string; bullets: string[] }> = {
  novel: { eyebrow: "STAGE 01 · STORY INTELLIGENCE", title: "小说分析", description: "把原始故事整理为可供剧本改编的结构化创作资料。", next: "/script", nextLabel: "进入剧本创作", bullets: ["故事梗概与核心命题", "人物档案、人物弧光与关系图", "主线、支线与关键情节点", "短剧改编建议与分集钩子"] },
  script: { eyebrow: "STAGE 02 · SCRIPT ROOM", title: "剧本创作", description: "以分集、场次和对白为核心组织剧本内容。", next: "/assets", nextLabel: "管理视觉素材", bullets: ["分集大纲与每集结尾钩子", "场景标题、动作描述与对白", "角色台词和连续性检查", "版本记录与剧本导出预留"] },
  assets: { eyebrow: "STAGE 03 · ASSET LIBRARY", title: "素材资产", description: "集中管理角色、场景、道具和服装，建立视觉一致性。", next: "/storyboard", nextLabel: "开始分镜设计", bullets: ["角色外观、年龄与服饰设定", "场景环境、时间和氛围", "关键道具及其剧情用途", "参考图、提示词与素材版本"] },
  storyboard: { eyebrow: "STAGE 04 · SHOT DESIGN", title: "分镜设计", description: "将剧本场次拆解为可执行的镜头序列。", next: "/video", nextLabel: "前往视频生成", bullets: ["景别、机位与镜头运动", "画面描述、对白和音效", "镜头时长与节奏控制", "关联角色、场景和道具资产"] },
  video: { eyebrow: "STAGE 05 · VIDEO LAB", title: "视频生成", description: "为选定分镜准备视频生成任务与输出管理。", next: "/projects", nextLabel: "查看项目", bullets: ["按镜头配置视频提示词", "生成参数与参考素材预留", "任务状态、进度和错误信息", "输出片段与后续剪辑预留"] },
  projects: { eyebrow: "WORKSPACE · PROJECTS", title: "全部项目", description: "统一查看创作项目，并跟踪项目所处的制作阶段。", next: "/novel", nextLabel: "进入小说分析", bullets: ["项目名称与故事简介", "当前工作流阶段与进度", "最近编辑时间与项目状态", "项目归档与搜索能力预留"] },
  settings: { eyebrow: "WORKSPACE · PREFERENCES", title: "项目设置", description: "集中管理创作偏好与后续模型服务配置。", next: "/", nextLabel: "返回创作工作台", bullets: ["默认画面比例与视觉风格", "剧本格式与分集偏好", "模型服务密钥通过环境变量配置", "团队权限与存储配置预留"] }
};

const iconMap = { novel: BookOpen, script: Clapperboard, assets: Images, storyboard: Film, video: WandSparkles, projects: FolderKanban, settings: Settings2 };

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const detail = pageDetails[section];
  if (!detail) return <div className="rounded-2xl border border-line bg-white p-8"><h1 className="text-xl font-semibold">页面不存在</h1><p className="mt-2 text-sm text-slate-500">请从创作工作台选择一个有效的工作流阶段。</p><Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm text-brand"><ArrowLeft size={16}/>返回工作台</Link></div>;
  const Icon = iconMap[section as keyof typeof iconMap] ?? CircleDashed;
  const isWorkflow = workflowItems.some(item => item.href === `/${section}`);
  const currentIndex = workflowItems.findIndex(item => item.href === `/${section}`);
  return <div className="mx-auto max-w-5xl space-y-7">
    <div className="flex items-center gap-2 text-xs text-slate-400"><Link href="/" className="hover:text-brand">创作工作台</Link><span>/</span><span className="text-slate-600">{detail.title}</span></div>
    <section className="overflow-hidden rounded-[26px] border border-line bg-white">
      <div className="border-b border-line bg-gradient-to-r from-violet-50 via-white to-white p-6 md:p-9"><div className="flex items-start gap-4"><span className="rounded-2xl bg-white p-3 text-brand shadow-sm ring-1 ring-violet-100"><Icon size={24}/></span><div><p className="text-[10px] font-bold tracking-[.17em] text-brand">{detail.eyebrow}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{detail.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{detail.description}</p></div></div>
        {isWorkflow && <div className="mt-7 grid grid-cols-5 gap-2">{workflowItems.map((item,i)=><div key={item.href}><div className={`h-1.5 rounded-full ${i <= currentIndex ? "bg-brand" : "bg-slate-200"}`}/><p className={`mt-2 text-[10px] sm:text-xs ${i === currentIndex ? "font-semibold text-brand" : "text-slate-400"}`}>{item.label}</p></div>)}</div>}
      </div>
      <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_.9fr] md:p-9">
        <div><h2 className="text-base font-semibold">本阶段规划</h2><p className="mt-1 text-sm text-slate-500">以下为第一阶段已规划的功能模块。</p><div className="mt-5 space-y-3">{detail.bullets.map((item,i)=><div key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-50 text-brand"><CheckCircle2 size={13}/></span><span className="text-sm leading-5 text-slate-700">{item}</span></div>)}</div></div>
        <div className="flex flex-col rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-5"><div className="flex items-center gap-2 text-sm font-semibold"><CircleDashed size={17} className="text-brand"/>功能开发状态</div><span className="mt-4 w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">界面骨架已建立</span><p className="mt-3 text-sm leading-6 text-slate-500">当前页面提供信息架构和后续开发入口，尚未连接持久化数据、真实 AI 生成或任务队列。</p><div className="mt-5 rounded-xl bg-white p-4"><p className="text-xs text-slate-400">下一步建议</p><p className="mt-1 text-sm font-medium">先定义真实数据结构与交互流程</p><p className="mt-2 text-xs leading-5 text-slate-500">确认输入、输出和编辑规则后，再接入模型服务。</p></div><Link href={detail.next} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark">{detail.nextLabel}<ArrowRight size={16}/></Link>
      </div>
    </div>
  </div>;
}
