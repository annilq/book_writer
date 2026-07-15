# 自主生成书籍 Agent — 设计文档

- 日期：2026-07-15
- 状态：已确认，待实现
- 关联代码：`app/(main)/components/BookOutlineForm.tsx`、`utils/prompts/index.ts`、`utils/index.ts`、`app/api/chapter/actions.ts`、`prisma/schema.prisma`

## 1. 背景与目标

当前 BookCraft 的核心业务流程（创建书 → 生成标准化提示词 → 生成章节大纲 → 逐章生成正文）全部依赖**对话式、逐步人工确认**：用户在 `chats/[id]` 中与 AI 多轮交互，每一步都要等待并确认。

本设计新增一个 **自主生成 Agent**：用户复用现有表单（标题 / 分类 / 描述 / 模型），勾选"自主生成"后，agent 在后台自动跑完整个流水线，**无需逐步确认**，仅保留最终人工发布关卡。

设计原则（方案 A + AgentRun 进度模块）：
- 复用现有提示词与落库逻辑，降低风险。
- 后台任务 + 进度流：用户可离开页面，避免长书超时。
- 引入轻量 `AgentRun` 进度记录，使流程概念上即为"自主 agent"，后续可平滑升级到 LangGraph。

## 2. 范围

### 纳入
- 新数据模型 `AgentRun` + `AgentRunStatus`。
- 后台编排器 `utils/agent/runner.ts`。
- 启动 / 查询接口 `app/api/book/[id]/agent/route.ts`。
- 表单"自主生成"开关 + 新进度页 `app/books/[id]/agent/`。
- 失败处理与"重试"。

### 不做（YAGNI）
- 不引入 LangGraph / SSE / 多实例任务队列（单进程 fire-and-forget）。
- 不做权限细分（沿用登录即可保存）。
- 不自动发布：生成完毕书籍仍为 `DRAFT`，保留人工发布关卡。

## 3. 数据模型

`prisma/schema.prisma` 新增：

```prisma
enum AgentRunStatus { RUNNING DONE FAILED }

model AgentRun {
  id          String         @id @default(nanoid(16))
  bookId      String         @unique
  book        Book           @relation(fields: [bookId], references: [id], onDelete: Cascade)
  status      AgentRunStatus @default(RUNNING)
  currentStep String         @default("PROMPT")   // PROMPT | OUTLINE | CHAPTER:i/n | COMPLETE
  log         Json?          // [{ ts: string, step: string, message: string }]
  error       String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

说明：
- `bookId @unique`：每本书同一时刻仅一个自主运行；重试前先清除旧 run。
- 粗粒度状态仍以 `Book.step`（INIT/OUTLINE/CHAPTER/COMPLETE）兜底，前端可同时读取。

## 4. 编排器 `utils/agent/runner.ts`

导出 `runAutonomousBook(bookId: string)`，按阶段更新 `AgentRun.currentStep` 与 `log`：

1. **PROMPT**：书籍创建时已由 `createBook`（`app/api/chat/actions.ts`）生成 `book.prompt` 并置 `step=OUTLINE`，此处直接复用，仅记录 log。
2. **OUTLINE**：
   - 用 `generateText`（非流式）调用 `getAIModel` + `getOutlinePrompt(book)`（`utils/prompts/index.ts:102`）产出大纲文本。
   - 解析：复用 `StructuredOutputParser.fromZodSchema(ChaptersSchema)` 与 `extractJsonCodeFromMarkdown`（`utils/index.ts:61`）从 markdown 提取 JSON，得到章节树。
3. **保存章节**：复用 `createBookOutline(bookId, chapters)`（`app/api/chat/actions.ts:163`）将树扁平化并落库，`step=CHAPTER`。
4. **CHAPTER:i/n**：遍历 `leaf` 章节，对每个调用新增的 `generateChapterContent(chapterId, model, book)`（`generateText` 版，与 `fetchChapterContent` 共用同一 system prompt 构造），生成后用 `saveChapterContent`（`app/api/chapter/actions.ts:106`）落库并推进 `currentChapterId`。每写完一章更新 `currentStep=CHAPTER:i/n`。
5. **COMPLETE**：所有叶子章节完成后置 `book.step=COMPLETE`、`AgentRun.status=DONE`、`currentStep=COMPLETE`。

错误处理：每个阶段包 `try/catch`；任意失败置 `AgentRun.status=FAILED`、`error=message`，并保留已生成部分（书籍不进入错误态）。

进度写入辅助：`appendLog(runId, step, message)` 读取现有 `log` 数组追加后写回；`setStep(runId, step)` 更新 `currentStep`。

## 5. API 路由 `app/api/book/[id]/agent/route.ts`

- `POST`：
  - 校验登录（复用现有 `auth()`）。
  - 若已存在该 `bookId` 的 `AgentRun` 且非 `FAILED`，返回冲突；否则重置（删除旧 run 及其 chapters）后创建新 `AgentRun(status=RUNNING)`。
  - **fire-and-forget**：`runAutonomousBook(bookId).catch(...)` 启动，响应立即返回 `{ runId }`。注明：单进程后台执行，生产环境需替换为实现队列 / Worker。
- `GET`：返回 `{ run, bookStep, chaptersTotal, chaptersDone }`，供前端轮询。

## 6. 前端

- `app/(main)/components/BookOutlineForm.tsx`：
  - 增加 `自主生成` 开关（`components/ui/switch`）。
  - 关闭时行为不变（进 `chats/[id]`）。
  - 开启时：`createBook(formData)` 创建书 → `POST /api/book/[id]/agent` → `router.push('/books/'+book.id+'/agent')`。
- 新页面 `app/books/[id]/agent/page.tsx` + 客户端进度组件：
  - 步骤条：写提示词 → 大纲 → 逐章 → 完成。
  - `AgentRun.log` 时间线 + 章节完成度（`chaptersDone/chaptersTotal`）。
  - 每 ~2s 轮询 `GET /api/book/[id]/agent`。
  - `status=DONE`：提供"查看书籍"入口（跳 `/books/[id]` 或 `/content/[id]`）。
  - `status=FAILED`：展示 `error` + "重试"按钮（重试即再次 `POST`）。

## 7. 复用清单（避免重复）

| 能力 | 复用位置 |
|---|---|
| 标准化提示词 | `getStandardBookPrompt`（`utils/prompts/index.ts:19`） |
| 大纲提示词 + Zod schema | `getOutlinePrompt`（`utils/prompts/index.ts:102`） |
| 大纲 JSON 解析 | `extractJsonCodeFromMarkdown`（`utils/index.ts:61`） |
| 章节树扁平化 | `flattenChaptersWithPosition`（`utils/index.ts:213`） |
| 保存章节 | `createBookOutline`（`app/api/chat/actions.ts:163`） |
| 保存章节正文 | `saveChapterContent`（`app/api/chapter/actions.ts:106`） |
| 模型适配 | `getAIModel`（`utils/ai_providers/index.ts`） |

新增 `generateChapterContent`（generateText 版）与现有 `fetchChapterContent`（streamText 版）共用同一 system prompt 构造逻辑。

## 8. 测试

- 单元：
  - `extractJsonCodeFromMarkdown` 解析多种 markdown 包裹。
  - `flattenChaptersWithPosition` 路径编码正确。
  - `runAutonomousBook` 步骤迁移（mock `getAIModel`/`generateText`），验证 `AgentRun` 状态与章节落库顺序。
- 手动：自主模式建书 → 观察进度页 → 校验 DB 中 `book.prompt`、chapters、chapter.content、step=COMPLETE。

## 9. 实施步骤（概览，详细计划见 writing-plans）

1. Prisma：加 `AgentRun` / `AgentRunStatus` → `prisma generate` + `db push`。
2. `utils/agent/runner.ts`：编排器 + `generateChapterContent` + 进度辅助。
3. `app/api/book/[id]/agent/route.ts`：启动 / 查询。
4. `BookOutlineForm.tsx`：自主生成开关与提交分支。
5. `app/books/[id]/agent/`：进度页 + 客户端轮询组件。
6. 联调与测试。
