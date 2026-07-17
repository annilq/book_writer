# BookCraft（AI 写书平台）业务功能与流程说明

> 本文档基于当前代码实现整理，涵盖核心业务概念、功能模块、关键流程及近期修复点。

## 1. 项目简介

BookCraft 是一个 **AI 辅助写书平台**：用户通过 GitHub 登录后，输入书名与创意描述，即可让大模型**自动或半自动生成一本完整书籍**——先生成结构化大纲（章节树），再逐章生成正文。

平台提供两种创作模式：

- **自主生成（Autonomous）**：一次性提交，后台自动跑完「大纲 → 逐章正文」，用户只需查看进度。
- **交互式生成（Chat / Manual）**：以对话方式逐步引导 AI 生成大纲与每章内容，用户可编辑、刷新、保存。

## 2. 技术栈

| 层面 | 选型 |
| --- | --- |
| 框架 | Next.js 15（App Router）、React 18、TypeScript |
| AI | AI SDK v7（`@ai-sdk/openai`、`@ai-sdk/deepseek`、`@ai-sdk/openai-compatible`），`generateText` / `streamText` |
| 数据库 | Prisma 7 + PostgreSQL |
| 鉴权 | `next-auth` v5（仅 GitHub Provider） |
| 样式 | Tailwind CSS + Radix UI（shadcn 风格组件） |
| 国际化 | `i18next` + `react-i18next`（中 / 英双语，文案在 `utils/i18n/app_zh.json` / `app_en.json`） |
| 状态 | `zustand`（book / chapter / message store）、`swr`、`immer` |
| 其它 | `react-arborist`（大纲树）、`react-markdown`（内容渲染）、Stripe / 微信支付 / 兑换码（订阅系统） |

## 3. 核心业务概念（数据模型）

数据模型见 `prisma/schema.prisma`，关键实体：

- **Book（书）**
  - `title`、`description`、`model`（格式 `provider/model`）、`language`、`prompt`（由 LLM 生成的标准化创作指令）
  - `step`：`INIT` → `OUTLINE` → `CHAPTER` → `COMPLETE`（书籍生成阶段）
  - `currentChapterId`：当前正在生成/编辑的叶子章节指针
  - `status`：`DRAFT` / `PUBLISHED` / `ARCHIVED` 等；`isPublic` 控制是否在探索页公开
- **Chapter（章节）**
  - `title`、`description`、`content`（正文）
  - `leaf`：是否为叶子章节（真正写正文的对象）
  - `position`：**路径编码**（如 `1`、`1.1`、`1.1.1`），用于表达层级大纲
- **Message（消息）**
  - 对话 / 编辑历史，`role` + `content` + `parts`（文本片段）
  - 既可用于**书级大纲对话**，也可用于**章节级编辑**，通过 `bookId` / `chapterId` 关联
- **AgentRun（自主生成任务）**
  - `status`：`RUNNING` / `DONE` / `FAILED`
  - `currentStep`、`log`（时间线日志）、`error`
- **其他**：`User`、`Tag`、`Category`、`Review`、`Publisher`，以及订阅相关（`SubscriptionPlan`、`Subscription`、`PaymentOrder`、`RedemptionCode` 等）。

## 4. 主要功能模块

| 路由 | 功能 |
| --- | --- |
| `/`（首页 `(main)`） | 建书入口 `BookOutlineForm`：填写书名、描述、分类、模型，并提供 `autonomous` 开关与示例模板（一键填充） |
| `/books/[id]/agent` | **自主生成进度页**：横向步骤条、章节进度条、状态横幅、生成日志时间线（见第 7 节，已做国际化与重设计） |
| `/chats/[id]` | **交互式大纲对话**：以聊天方式生成书籍大纲，流式输出存入 `Message` |
| `/books/[id]` | **书工作台**：左侧大纲树（`react-arborist`），点击章节在右侧调 `/api/chapter` 流式生成/编辑正文，可保存 |
| `/content/[id]` | **阅读视图**：大纲树 + 章节内容展示；点击章节查看正文（已实现 `Message` 为空时回退读 `chapter.content`） |
| `/books` | **书架**：管理自己的书项目，支持搜索、新建、网格/列表切换 |
| `/explore` | **探索**：浏览公开书籍 |
| `/user` `/settings` `/subscription` `/admin` `/docs` | 用户中心、设置、订阅与支付、管理后台、帮助文档 |

## 5. 核心业务流程

### 流程 A：自主生成（Autonomous）—— 一键成书

1. **提交建书**：首页表单 `autonomous = true` → 调用 `createBook`。
2. **`createBook`**（`app/api/chat/actions.ts`）：
   - 创建 `Book` 记录；
   - 调用 `fetchBookPrompt`，用 LLM 把用户描述生成**标准化 prompt** 写入 `book.prompt`；
   - 写入首条 `user` 类型的 `Message`（大纲请求文案，来自 i18n `bookOutlinePrompt`）。
3. **启动任务**：`POST /api/book/[id]/agent`（`app/api/book/[id]/agent/route.ts`）：
   - 鉴权（未登录返回 `Unauthorized`）；
   - 清理旧的 `AgentRun` 与 `Chapter`（保证「重试」幂等，不会卡在旧的 `RUNNING`）；
   - 新建 `AgentRun(status=RUNNING)`，`runAutonomousBook` **异步 fire-and-forget** 执行。
4. **`runAutonomousBook`**（`utils/agent/runner.ts`）四阶段：
   - `PROMPT`：记录「Standard prompt ready」；
   - `OUTLINE`：`generateText` + `getOutlinePrompt(book)` 生成大纲文本 → `parseOutlineToChapterInputs` 解析 → `createBookOutline` 落库（扁平化为带 `position` 的章节树，`step` 置 `CHAPTER`，`currentChapterId` 指向第一个叶子）；
   - `CHAPTER`：查询所有 `leaf` 章节，**循环** `generateChapterContent`——注入**目标章节的 title/description**（避免各章内容雷同）→ `saveChapterContent` 写入 `chapter.content` 并推进 `currentChapterId`；全部完成 `step = COMPLETE`；
   - 成功 `status = DONE`；异常 `status = FAILED` 并记录 `error`。
5. **进度展示**：`/books/[id]/agent` 前端轮询 `GET /api/book/[id]/agent`，展示步骤、章节完成度、日志；完成后跳转 `/content/[id]` 阅读。

> 说明：自主生成把正文直接写入 `chapter.content`，**不写 `Message` 表**（阅读页已做回退：无 `Message` 时显示 `chapter.content`）。

### 流程 B：交互式生成（Chat / Manual）—— 对话式创作

1. **提交建书**：首页 `autonomous = false` → `createBook`（同上生成 prompt）→ 跳转到 `/chats/[id]`。
2. **大纲对话**：`useChat` 调用 `POST /api/chat` → `fetchBookOutline` 流式生成大纲，结果以 `assistant` `Message` 存储。
3. **章节编辑**：进入 `/books/[id]`，左侧大纲树点击章节 → 右侧 `ChatBox` 调用 `POST /api/chapter` 的 `fetchChapterContent` 流式生成正文（存入章节级 `Message`）；点击 ✓ 触发 `saveChapterContent`，写入 `chapter.content` 并推进 `currentChapterId`；当 `step = COMPLETE` 提示前往阅读 `/books/[id]`（或 `/content/[id]`）。

### 关键数据存储差异

| 操作 | 正文落库位置 | 对话历史 |
| --- | --- | --- |
| 自主生成 | `chapter.content` | 无 `Message` |
| 交互式生成 | `chapter.content`（`onSave`） | `Message` 表（书级 + 章节级） |

阅读页 `/content/[id]` 通过 `getMessageOfChapter` 读 `Message`，**无记录时回退显示 `chapter.content`**，从而两种模式的产出都能正确展示。

## 6. 关键 API / Server Actions 速查

| 接口 / 函数 | 位置 | 作用 |
| --- | --- | --- |
| `POST/GET /api/book/[id]/agent` | `app/api/book/[id]/agent/route.ts` | 启动 / 查询自主生成任务 |
| `createBook` / `fetchBookPrompt` / `createBookOutline` / `createMessage` | `app/api/chat/actions.ts` | 建书、生成 prompt、写大纲章节、写消息 |
| `fetchBookOutline` | `app/api/chat/actions.ts` | 流式生成书级大纲（交互式） |
| `fetchChapterContent` / `createChapterMessage` / `saveChapterContent` / `getMessageOfChapter` | `app/api/chapter/actions.ts` | 章节正文流式生成 / 存储 / 落库 / 读取 |
| `runAutonomousBook` / `generateChapterContent` | `utils/agent/runner.ts` | 自主生成编排与章节生成 |
| `getBookById` | `app/api/book/actions.ts` | 取书籍及章节、消息、分类 |

提示词模板来自 `utils/prompts/`（`getOutlinePrompt`、`getStandardBookPrompt`），章节级系统提示引用 i18n 的 `bookChapterPrompt` / `bookOutlinePrompt`，均使用 **AI SDK v7 的顶层 `system` 选项**。

## 7. 近期修复与当前状态（本会话改动）

1. **AI SDK v7 适配（必改）**
   v7 不允许 `messages` 中出现 `role: "system"`，系统提示必须放在顶层 `system` 选项。已修复 4 处：
   - `utils/agent/runner.ts` 2 处（大纲 + 章节）：原仅一条 system 消息，移走后补一条最小 `user` 消息避免 `messages` 为空；
   - `app/api/chat/actions.ts`（`fetchBookOutline`）；
   - `app/api/chapter/actions.ts`（`fetchChapterContent`）。

2. **章节内容重复 / 缺失**
   `generateChapterContent` 原只给「整本大纲 + 通用用户语」，未指明具体章节 → 各章内容雷同、个别为空。已改为注入**目标章节的 `title`/`description`**，每章生成各自专属内容。

3. **阅读页「有列表、点进去无数据」**
   自主生成未写 `Message`，而阅读页原本只查 `Message` 表。已在 `app/content/[id]/components/outline.tsx`（点击章节）与 `app/content/[id]/page.tsx`（初始加载）增加**回退逻辑**：`Message` 为空时读取 `chapter.content` 渲染。

4. **`/books/[id]/agent` 进度页国际化 + 重设计**
   - 补充中/英 `agent*` 系列 i18n key（`agentTitle`、`agentStep*`、`agentStatus*`、`agentChapterProgress`、`agentViewBook`、`agentLogTitle` 等）；
   - 原裸代码步骤（`PROMPT` 等）改为友好标签（准备 / 大纲 / 章节 / 完成）；
   - 重设计为：页头（含书名）→ 横向步骤条 → 章节进度条 → 状态横幅（进行/完成/失败，含重试与查看书籍）→ 日志时间线，并增加首屏 loading 态。

> 提示：`/api/book/[id]/agent` 的 `POST` 必须 **GitHub 登录** 后才能成功，否则返回 `{"code":-1,"info":"Unauthorized"}`。

## 8. 运行与配置

环境变量（`.env`）：

```bash
DATABASE_URL=postgresql://...
AUTH_GITHUB_ID=你的_GitHub_OAuth_Client_ID
AUTH_GITHUB_SECRET=你的_GitHub_OAuth_Client_Secret
AUTH_SECRET=随机密钥   # 可用 npx auth secret 生成
```

GitHub OAuth App 的 **Authorization callback URL**：`http://localhost:3000/api/auth/callback/github`

常用命令：

```bash
yarn dev        # 本地开发
yarn build      # 含 prisma generate / db push（--force-reset）/ seed / next build
yarn test       # vitest 运行测试
yarn seed       # 初始化种子数据
```

## 9. 已知限制与建议

- 自主生成目前为**单进程 fire-and-forget**，生产环境建议迁移到队列 / Worker（代码注释中已标注）。
- 自主生成时进入每个章节的 `book.chapters` 上下文为扁平叶子列表（非完整层级树），章节级上下文一致性可进一步优化。
- 进度页 `chaptersTotal` 统计全部章节数，而实际操作的是 `leaf` 章节，二者计数口径不一致，展示层可进一步对齐。
