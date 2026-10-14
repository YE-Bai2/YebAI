import { BookOpen, Clapperboard, Film, FolderKanban, Images, LayoutDashboard, Settings2, WandSparkles, type LucideIcon } from "lucide-react";

export interface NavItem { label: string; href: string; icon: LucideIcon; description: string; }

export const workflowItems: NavItem[] = [
  { label: "小说分析", href: "/novel", icon: BookOpen, description: "拆解故事结构与人物关系" },
  { label: "剧本创作", href: "/script", icon: Clapperboard, description: "将故事改编为分集剧本" },
  { label: "素材资产", href: "/assets", icon: Images, description: "管理角色、场景与道具" },
  { label: "分镜设计", href: "/storyboard", icon: Film, description: "规划镜头与画面节奏" },
  { label: "视频生成", href: "/video", icon: WandSparkles, description: "将分镜制作成视频片段" }
];

export const primaryItems: NavItem[] = [
  { label: "创作工作台", href: "/", icon: LayoutDashboard, description: "项目概览与创作入口" },
  { label: "全部项目", href: "/projects", icon: FolderKanban, description: "查看和管理项目" }
];

export const settingsItem: NavItem = { label: "项目设置", href: "/settings", icon: Settings2, description: "项目偏好与工作流设置" };
