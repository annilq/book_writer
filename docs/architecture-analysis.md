# BookCraft 项目架构分析报告

> 基于代码审查的全景分析，涵盖架构设计、业务功能、交互体验与设计规范四个维度。

---

## 一、架构分析

### 1.1 技术栈总览

| 层面 | 技术选型 | 版本 |
|------|---------|------|
| 框架 | Next.js (App Router) | 15.x |
| UI 框架 | React + TypeScript | 18.3 / 5.1.6 |
| AI SDK | Vercel AI SDK | v7 |
| AI 框架 | LangChain | 0.3.x |
| ORM | Prisma | 7.x |
| 数据库 | PostgreSQL | - |
| 鉴权 | next-auth | v5 (beta) |
| 样式 | Tailwind CSS + Radix UI (shadcn) | latest |
| 国际化 | i18next + react-i18next | 24.x / 15.x |
| 状态管理 | Zustand + SWR + immer | 5.x / 2.x / 10.x |
| 支付 | Stripe + wechatpay-node-v3 | 20.x / 2.x |
| 富文本 | MDX Editor + Slate | 3.x / 0.112 |
| 测试 | Vitest | 2.x |

### 1.2 分层架构

项目采用经典的五层架构：

```
Presentation → Application → AI Engine → Data → External Services
```

**表现层 (Presentation)**
- Next.js App Router，混合使用 RSC (Server Components) 和 Client Components
- 路由组 `(main)` 隔离首页布局
- shadcn/ui 组件库 (new-york 风格, zinc base color) + 30+ Radix UI 原语
- 状态管理三件套：Zustand (book/chapter/message store)、SWR (数据请求缓存)、immer (不可变更新)

**应用层 (Application)**
- API Routes: 25 个 route.ts，覆盖 chat/chapter/book/agent/payment/subscription/admin
- Server Actions: `app/api/chat/actions.ts` 和 `app/api/chapter/actions.ts` 中的 `"use server"` 函数
- Agent Runner: `utils/agent/runner.ts` 实现自主生成的四阶段编排 (PROMPT → OUTLINE → CHAPTER → COMPLETE)
- 鉴权: next-auth v5 + PrismaAdapter，仅支持 GitHub OAuth，首个注册用户自动成为 ADMIN

**AI 引擎层 (AI Engine)**
- AI SDK v7: `streamText` (流式) + `generateText` (非流式)
- 多 Provider 支持: OpenAI / DeepSeek / Ollama (via openai-compatible) / Alibaba
- Prompt 系统: `utils/prompts/index.ts` 三套提示词模板 (standard book / outline / chapter)
- LangChain: 用于结构化输出解析 (`StructuredOutputParser` + Zod schema)
- 关键适配: v7 要求 `system` 提示在顶层选项而非 messages 数组

**数据层 (Data)**
- Prisma 7 + PostgreSQL
- 核心模型: User / Book / Chapter / Message / AgentRun
- 订阅模型: SubscriptionPlan / Subscription / PaymentOrder / RedemptionCode
- Chapter 使用路径编码 (`position` 字段, 如 "1.1.2") 表达层级关系

**外部服务 (External Services)**
- GitHub OAuth (登录)
- Stripe (信用卡支付 + webhook)
- WeChat Pay (微信支付)
- Supabase (可选存储)

### 1.3 数据流模式

项目存在两种数据流模式：

| 模式 | 场景 | 机制 |
|------|------|------|
| SSE 流式 | 大纲生成、章节内容生成 | `useChat` → `streamText` → `toUIMessageStreamResponse` |
| 轮询 | 自主生成进度 | 前端定时 `GET /api/book/[id]/agent` 查询 AgentRun 状态 |

### 1.4 关键架构决策与权衡

**自主生成的 fire-and-forget 模式**
- 当前实现: 单进程异步执行 `runAutonomousBook(bookId).catch(...)`
- 优势: 实现简单，无需额外基础设施
- 风险: 进程崩溃则任务丢失，无法水平扩展
- 代码中已标注: "production should move this to a queue/worker"

**AI SDK v7 的 system 提示适配**
- v7 禁止 `messages` 数组中出现 `role: "system"`，必须在顶层 `system` 选项传入
- 已修复 4 处调用点 (runner.ts x2, chat/actions.ts, chapter/actions.ts)

**SWR 自定义 fetcher 的 useChat 兼容**
- `ClientContext` 中 SWR fetcher 对 `/api/chat` 路径返回 `undefined`，避免与 AI SDK 的 `useChat` 冲突

---

## 二、业务功能分析

### 2.1 核心业务概念

```
Book (书)
├── step: INIT → OUTLINE → CHAPTER → COMPLETE
├── status: DRAFT / PUBLISHED / ARCHIVED / DELETED / UNPUBLISHED / PENDINGREVIEW
├── currentChapterId: 当前编辑的叶子章节指针
│
├── Chapter (章节)
│   ├── position: 路径编码 ("1", "1.1", "1.1.1")
│   ├── leaf: 是否叶子章节 (真正写正文的)
│   └── content: 正文内容
│
├── Message (消息)
│   ├── bookId: 书级对话 (大纲生成)
│   └── chapterId: 章节级对话 (正文编辑)
│
└── AgentRun (自主生成任务)
    ├── status: RUNNING / DONE / FAILED
    ├── currentStep: PROMPT / OUTLINE / CHAPTER:N/M / COMPLETE
    └── log: 时间线日志 (JSON)
```

### 2.2 两种创作模式

**模式 A: 自主生成 (Autonomous) — 一键成书**

1. 首页表单 `autonomous=true` → `createBook` 创建 Book 记录
2. `fetchBookPrompt` 用 LLM 将用户描述生成标准化创作 prompt
3. 写入首条 user Message (大纲请求文案)
4. `POST /api/book/[id]/agent` 启动后台任务
5. `runAutonomousBook` 四阶段执行:
   - PROMPT: 确认 prompt 就绪
   - OUTLINE: `generateText` 生成大纲 → 解析 → 落库
   - CHAPTER: 循环 `generateChapterContent` 逐章生成正文
   - COMPLETE: 更新状态
6. 前端轮询进度页 `/books/[id]/agent`
7. 完成后跳转 `/content/[id]` 阅读

**模式 B: 交互式生成 (Chat) — 对话式创作**

1. 首页表单 `autonomous=false` → `createBook` → 跳转 `/chats/[id]`
2. `useChat` 调用 `POST /api/chat` → `fetchBookOutline` 流式生成大纲
3. 大纲存为 assistant Message
4. 进入 `/books/[id]` 工作台:
   - 左侧大纲树 (`react-arborist`)
   - 点击章节 → 右侧 `ChatBox` 调 `POST /api/chapter` 流式生成正文
   - 点击 ✓ 保存 → `saveChapterContent` 写入 `chapter.content`
5. 全部章节完成 → `step=COMPLETE` → 前往阅读

**数据存储差异**

| 操作 | 正文位置 | 对话历史 |
|------|---------|---------|
| 自主生成 | `chapter.content` | 无 Message |
| 交互式生成 | `chapter.content` (onSave) | Message 表 (书级 + 章节级) |

阅读页通过回退逻辑兼容两种模式: Message 为空时读取 `chapter.content`。

### 2.3 功能模块清单

| 路由 | 功能 | 关键组件 |
|------|------|---------|
| `/` (main) | 建书入口，模式选择 + 表单 + 示例模板 | `BookOutlineForm` |
| `/chats/[id]` | 交互式大纲对话 | `useChat` + `ChatLog` |
| `/books/[id]` | 书工作台 (大纲树 + 章节编辑) | `react-arborist` + `ChatBox` |
| `/books/[id]/agent` | 自主生成进度页 | `AgentProgress` (步骤条 + 进度条 + 日志) |
| `/content/[id]` | 阅读视图 (大纲树 + 正文展示) | `Outline` + `react-markdown` |
| `/books` | 书架管理 (搜索、新建、网格/列表) | - |
| `/explore` | 探索公开书籍 | - |
| `/user/*` | 用户中心 (资料/通知/订单/订阅) | - |
| `/settings` | 设置 | - |
| `/subscription` | 订阅与支付 | Stripe / WeChat Pay / 兑换码 |
| `/admin/*` | 管理后台 (用户/订阅计划/订单/兑换码) | - |
| `/docs` | 帮助文档 | - |

### 2.4 订阅与支付体系

```
SubscriptionPlan (订阅计划)
├── RedemptionCode (兑换码) → 兑换激活
├── PaymentOrder (支付订单)
│   ├── provider: STRIPE / WECHAT / REDEMPTION
│   └── status: PENDING / COMPLETED / FAILED / REFUNDED / CANCELLED
└── Subscription (用户订阅)
    ├── status: PENDING / ACTIVE / EXPIRED / CANCELLED
    └── renewMode: AUTO / MANUAL
```

支付 Webhook:
- `/api/webhooks/stripe` — Stripe 支付回调
- `/api/webhooks/wechat` — 微信支付回调

---

## 三、交互体验分析

### 3.1 全局交互架构

**ClientContext 包裹层**
```
SWRConfig (全局 fetcher + 缓存)
  └── ThemeProvider (next-themes, class 策略, system 默认)
      └── SessionProvider (next-auth)
          └── children + Toaster
```

**导航体验**
- Header: sticky top + backdrop-blur + scroll 响应阴影
- ActiveLink: 路由感知高亮 (`usePathname` 对比)
- 导航项: 首页 / 书架 (登录可见) / 探索 / 订阅 (登录可见)
- 右侧: 登录按钮 + 主题切换

**首页体验**
- 全屏 brand 色背景 (Indigo 500) + 白色文字
- 模式选择卡片: 对话式 vs 自主生成，可视化对比
- 表单: 书名 + 分类 + 描述 + 模型选择 + 生成按钮
- 示例模板: 一键填充 (3 个预设书目)
- 填充后提示: "已载入示例，可直接生成或继续编辑"

### 3.2 流式交互

**大纲对话 (`/chats/[id]`)**
- 使用 `@ai-sdk/react` 的 `useChat` hook
- SSE 流式输出: `streamText` → `toUIMessageStreamResponse({ sendReasoning: true })`
- 支持 reasoning 透传 (思维链展示)

**章节编辑 (`/books/[id]`)**
- ChatBox 组件: Textarea + 发送按钮 (Spinner / ArrowRight 切换)
- Enter 发送 / Shift+Enter 换行
- 编辑模式: 点击已有消息可编辑重发
- 流式中禁用输入 (`disabled={isStreaming}`)
- 保存: 点击 ✓ → `saveChapterContent` → 推进 `currentChapterId`

**自主生成进度 (`/books/[id]/agent`)**
- 横向步骤条: 准备 → 大纲 → 章节 → 完成
- 章节进度条: 已完成 / 总数
- 状态横幅: 进行中 / 完成 / 失败 (含重试与查看书籍按钮)
- 日志时间线: 实时展示生成过程
- 首屏 loading 态
- 轮询间隔获取最新状态

### 3.3 交互亮点

1. **双模式选择可视化**: 首页用并排卡片展示两种创作模式，含图标 + 描述，选中态有 brand 色边框 + 背景着色
2. **大纲树交互**: `react-arborist` 提供展开/折叠、拖拽排序 (`@dnd-kit`)
3. **消息编辑**: 支持点击已有消息进入编辑态，顶部提示栏 + 关闭按钮
4. **进度可视化**: 自主生成页面的步骤条 + 进度条 + 日志时间线三层信息层级
5. **示例填充**: 一键填充预设书目信息，降低使用门槛

### 3.4 交互问题与改进空间

1. **ClientContext 的 isMounted 守卫**: 首次渲染返回 `false`，可能导致 SEO 爬虫看不到内容
2. **错误处理**: `toast` 提示较为简略，缺少错误详情和恢复建议
3. **加载态**: 部分页面缺少骨架屏，首次加载白屏
4. **移动端适配**: Header 导航 `overflow-x-auto` 在小屏幕上体验一般
5. **轮询策略**: 自主生成进度页使用固定间隔轮询，未做指数退避或 WebSocket 升级

---

## 四、设计规范分析

### 4.1 设计体系

项目采用 **Geist/Vercel 风格设计系统**，注释中明确标注: "Monochrome, High Contrast, Structural Borders"。

**shadcn/ui 配置**
- style: `new-york`
- baseColor: `zinc`
- cssVariables: `true`
- iconLibrary: `lucide`

### 4.2 色彩系统

**核心设计理念: 单色高对比 + 结构性边框**

| 语义 | Light Mode | Dark Mode | 用途 |
|------|-----------|-----------|------|
| background | 纯白 (0 0% 100%) | 纯黑 (0 0% 0%) | 页面背景 |
| foreground | 近黑 (0 0% 3.9%) | 近白 (0 0% 98%) | 主文本 |
| primary | 黑 (0 0% 9%) | 白 (0 0% 98%) | 主要按钮/操作 |
| secondary | Neutral 100 | Neutral 900 | 次要背景 |
| muted | Neutral 100 | Neutral 900 | 静默背景 |
| border | Neutral 200 | Neutral 800 | 结构性边框 |
| brand | Indigo 500 (243 75% 59%) | Indigo 400 (243 75% 68%) | 品牌强调色 |
| success | Emerald 600 | Emerald 400 | 成功状态 |
| warning | Amber 500 | Amber 400 | 警告状态 |
| destructive | Red 600 | Red 900 | 错误/删除 |

**色彩特点**:
- 整体偏单色系 (黑白灰为主)，仅在 brand/success/warning/destructive 处使用彩色
- Dark mode 采用纯黑背景 (非深灰)，追求极致对比
- brand 色是唯一的彩色强调，用于: 首页背景、选中态边框、链接、图标点缀

### 4.3 排版系统

```css
font-family: Public Sans (Google Fonts)

h1: text-3xl lg:text-4xl, font-semibold, tracking-tight
h2: text-2xl lg:text-3xl, font-semibold, tracking-tight
h3: text-xl lg:text-2xl, font-semibold, tracking-tight
h4: text-lg, font-semibold, tracking-tight
p:  leading-7, text-muted-foreground, mt-6 (非首段)

code: rounded, bg-muted, font-mono, text-sm
a:   font-medium, underline-offset-4, hover:underline
```

**排版特点**:
- 只用两种字重: 400 (regular) 和 500/600 (semibold)
- `tracking-tight` 用于标题，收紧字间距
- 段落使用 `muted-foreground` 降低视觉权重，突出标题层级

### 4.4 间距与圆角

```
--radius: 0.375rem (6px) — 克制的圆角
--radius-md: calc(0.375rem - 2px) = 4px
--radius-sm: calc(0.375rem - 4px) = 2px
```

**圆角策略**: 整体偏方正 (6px 基础圆角)，ChatBox 等对话组件使用 2xl 圆角 (16px) 作为例外。

### 4.5 组件规范

**Button (CVA variants)**
```
variants: default / destructive / outline / secondary / ghost / link
sizes: default (h-9) / sm (h-8) / lg (h-10) / icon (h-9 w-9)
```

**动画**
- `tailwindcss-animate` 提供 accordion 展开/收起动画
- `transition-colors` / `transition-all` 用于交互反馈
- `tailwind-scrollbar` 自定义滚动条样式

**暗色模式**
- 通过 `next-themes` 的 `class` 策略实现
- `@custom-variant dark (&:is(.dark *))` 定义暗色变体
- 所有颜色使用 CSS 变量，暗色模式自动切换

### 4.6 国际化

- 双语支持: 中文 (`app_zh.json`) + 英文 (`app_en.json`)
- 语言检测: `i18next-browser-languagedetector` 自动检测浏览器语言
- 回退语言: `en`
- 服务端 i18n: `utils/i18n/server.ts` 的 `getI18n(language)` 用于 Agent 和 Server Action 中的提示词本地化
- AI prompt 也通过 i18n 注入: `bookOutlinePrompt` / `bookChapterPrompt`

### 4.7 设计规范总结

| 维度 | 规范 | 评价 |
|------|------|------|
| 色彩 | 单色系 + 单一 brand 色 | 统一克制，但略显单调 |
| 排版 | Public Sans + 两级字重 | 清晰高效，工程感强 |
| 圆角 | 6px 基础 (方正) | 与 Geist 风格一致 |
| 边框 | Neutral 200 (结构性) | 用边框而非阴影定义结构 |
| 动画 | 克制 (transition-colors) | 无过度装饰 |
| 暗色 | 纯黑背景 + 自动切换 | 极致对比 |
| 图标 | Lucide React | 与 shadcn 生态一致 |
| 响应式 | Tailwind 断点 (sm/lg) | 基础覆盖，移动端可加强 |

---

## 五、已知问题与改进建议

### 架构层面
1. **自主生成可靠性**: fire-and-forget 模式应迁移到队列/Worker (已标注)
2. **章节计数口径**: `chaptersTotal` 统计全部章节，实际操作 leaf 章节，展示层不一致
3. **章节上下文**: 自主生成时各章上下文为扁平叶子列表，非完整层级树

### 体验层面
4. **ClientContext SSR**: `isMounted` 守卫导致首屏无内容，影响 SEO 和首屏体验
5. **错误恢复**: 自主生成失败后仅提供"重试"，缺少部分恢复能力
6. **加载态**: 缺少骨架屏，部分页面白屏过渡

### 设计层面
7. **色彩丰富度**: brand 色使用场景可扩展 (如不同状态区分)
8. **移动端**: Header 导航和表格组件在小屏幕上体验待优化
9. **空状态**: 部分列表页缺少友好的空状态设计

---

*报告生成时间: 2026-08-04*
*基于代码库: /Users/yunqi/Documents/develop/book_writer*
