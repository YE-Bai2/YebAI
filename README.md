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


## 第二阶段：故事分析与剧本编辑

- `/novel`：输入故事文本，可运行本地规则演示分析；切换到 AI API 模式后调用服务端分析接口。
- `/script`：编辑分集标题、梗概、场景、动作描述、角色对白与表演提示。
- 剧本草稿保存在当前浏览器的 localStorage，可导出为 TXT；尚未同步至云端。
- `POST /api/analyze`：OpenAI-compatible Chat Completions 接口，API key 仅从服务端环境变量读取。

启用真实模型分析时，在本地 `.env.local` 配置：

```bash
OPENAI_API_KEY=your_server_side_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

然后重启开发服务器。兼容接口必须支持 Chat Completions 与 JSON object response format。不要把密钥放在以 `NEXT_PUBLIC_` 开头的变量中，也不要提交真实密钥。


## 第三阶段：AI 剧本初稿生成

- `/script/generate`：输入故事梗概，选择 1–5 集与风格要求，生成分集、场景动作和对白。
- 从 `/novel` 的分析结果页跳转时，会通过当前标签页的 sessionStorage 临时带入故事原文；不会自动把分析结果当作已审核的剧本设定。
- `POST /api/generate-script`：服务端调用 OpenAI-compatible Chat Completions，并对返回的分集、场景、对白字段做基础校验与长度限制。
- 点击“保存并进入编辑器”后，生成稿写入浏览器 localStorage，进入 `/script` 继续编辑。当前仍是本地草稿，不是云端项目数据。
- 真实生成需要配置上文的服务端模型环境变量。模型生成内容须人工检查人物连续性、版权和事实准确性。
