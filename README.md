# YebAI · AI 短剧创作平台

YebAI 是一个围绕“小说分析 → 剧本创作 → 视觉素材 → 分镜设计 → 视频生成”组织的短剧制作工作台。

## 第一阶段目标

- 将单文件演示升级为 Next.js App Router + TypeScript 项目。
- 建立统一导航、响应式应用外壳和基础视觉规范。
- 建立工作台及五个生产阶段、项目列表、设置页面骨架。
- 定义项目、角色、视觉资产、剧本、分镜和生成任务的共享类型。
- 为后续模型、数据库、对象存储和任务队列集成预留配置入口。

## 本地运行

需要 Node.js 20 或兼容的 Node.js LTS 版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 http://localhost:3000 。

## 常用命令

- `npm run dev`：启动开发服务器
- `npm run build`：生产构建
- `npm run start`：启动生产服务
- `npm run typecheck`：TypeScript 类型检查
- `npm run lint`：Next.js ESLint 检查

## 目录结构

```
app/
  [section]/page.tsx   # 小说、剧本、素材、分镜、视频、项目和设置页面
  globals.css
  layout.tsx
  page.tsx             # 创作工作台
components/
  AppShell.tsx         # 侧边导航、顶栏与响应式应用框架
lib/
  navigation.ts        # 导航配置
  types.ts             # 共享领域类型
index.html             # 初始单文件原型，作为视觉与交互参考
```

## 当前边界

当前是可交互的前端骨架：新建项目和故事分析入口仅为浏览器内演示状态，不会写入数据库，也不会调用真实大模型或生成图片、视频。不要将演示状态视为生产数据。

后续阶段建议依次完成：
1. 项目持久化与身份认证；
2. 小说解析、人物关系和剧本生成 API；
3. 视觉资产生成及文件存储；
4. 分镜编辑、生成任务队列和视频服务适配；
5. 日志、用量计费、错误恢复和部署流程。
