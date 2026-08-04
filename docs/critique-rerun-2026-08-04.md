# BookCraft 跨界面 UX 评审（重评 / Re-run）

**Method: dual-agent (A: agent-86b6a06c · B: agent-40e595b7)**

> 上一轮（2026-08-04 首次 critique）评分 **14/40（Poor）**。本轮在 P0/P1/P2 + polish 全部落地后重评。
> 本环境无浏览器自动化，Assessment B 仅完成 CLI 确定性扫描 + 手动源码核查（回退信号，非设计缺陷）。
> 目录级目标无稳定 slug，按 setup 跳过快照持久化与趋势追踪。

---

## 设计健康分（Nielsen 10 项 / 40）— 来自 Assessment A

| # | 启发式 | 分 | 关键问题 |
|---|--------|----|----------|
| 1 | 系统状态可见性 | 3 | AgentProgress 好，但 `chaptersTotal` 计父节点、runner 只填叶子 → 进度条停在 64% 却显示「Generation complete!」，终点自相矛盾 |
| 2 | 系统↔真实世界 | 2 | 让用户从 `qwq-32b/alibaba` 选模型写书；`Version N of M`、`ID: a1b2c3d4`、`Published` 是谎言 |
| 3 | 用户控制与自由 | 3 | RotateCcw+确认、编辑确认、Stop、可关庆祝、导出——实打实提升；但 RefreashMessage 下拉仍裸调销毁、无撤销 |
| 4 | 一致性与标准 | 2 | `book-viewer-layout` 与 `chapter-content` 近重读 + 重复版本工具条；`chapter-content` 是死代码；原始 `text-red-500`/`border-teal-50` 混杂 |
| 5 | 错误预防 | 2 | 两个 AlertDialog + JSON try/catch 真实；但 `FormMessage` 被 `absolute inset-0` textarea 盖住（输入 1 字回车静默无操作）、Settings 表单 `onSubmit` 仅 `console.log`、刷新后 `chapter?.id!` 非空断言崩 |
| 6 | 识别而非记忆 | 2 | 模式选中态仅 `bg-brand/5`（5% 透明近不可见）；全仓库 `FormLabel` 使用 **0 次**；`labelTitle` 等键已存在却无人用 |
| 7 | 灵活性与效率 | 2 | Enter 发送已修；但 textarea `disabled={isStreaming}`（AI 写时不能构思）、书架搜索/网格/New Book 全 inert |
| 8 | 美学与极简 | 2 | 阅读视图单看可评 4；启动卡片把所有字段平铺一卡、模型 Select 与 CTA 同行；聊天区是未分化 markdown 墙 |
| 9 | 错误识别/恢复 | 2 | `jsonParseError` 文案是代码库最佳；但 `GenerateErrorhandle` 仍 dump 原始栈、FAILED 横幅裸 `run.error`、两处聊天 `onError: console.log` |
| 10 | 帮助与文档 | 1 | `app/docs/page.tsx` 是合格 4 步+FAQ 页，但全仓库搜 `/docs` **零引用**，无人可达 |
| **总** | | **21/40** | **Fair（较 14/40 提升 +7）** |

> 增益精确落在修复落点：H1 +2（AgentProgress aria-live/安抚/重连）、H3 +2（确认弹窗/Stop/可关庆祝）、H5 +1、H9 +1。天花板被**启动页（零修复）**压住——那是每个用户第一个见到的屏幕。

---

## 设计专属性：部分逃逸，但仅 2/5 界面

阅读视图是第一个「只能属于写书产品」的屏幕：`content.tsx` 用 `font-mono tabular-nums text-brand` 渲染 `chapter.position`、`<h2>` 标题、`border-b` 分隔章节、`prose` 排版、`max-w-3xl`。`.prose p { text-foreground }` 这一行修复系统性 bug（全局 `p{text-muted-foreground}` 把整本书调灰）。导出 `.md` 与 `emptyBook` 文案是领域原生。

其余界面仍是「带树侧栏的通用 LLM 聊天」：`chat-log.tsx` 用户/AI 消息零视觉区分；`Refreash.tsx` 给每条 AI 消息挂 `deepseek-r1/alibaba` 模型下拉；`books/page.tsx` 显示 `ID: a1b2c3d4` 与 `new Date()`（注释自认造假）。

**品牌色确实旅行了**（首页 `bg-brand` → 阅读 `text-brand` → 大纲 FAB → 文档步骤图标 → 庆祝 `border-brand/30`），但品牌色 ≠ 设计专属性。只有阅读视图有「书」的**形态**。

**系统级不一致**：`--primary`（Geist 单色黑）与 `--brand`（靛蓝）同时用于各界面「最重要操作」——庆祝 CTA/agent 步进用 primary，阅读导出/空状态 CTA 用 brand。两个「主色」竞争，延伸品牌色反而加剧不一致（详见问题 P1-brand）。

---

## ⚠️ 本轮修复引入/遗留的真实缺陷（重点诚实项）

Assessment B 用令牌数学+手动核查，独立发现我本轮改动**并未真正解决**的几处：

1. **Token 对比度仍失败（polish 给了假安全感）**
   polish 把硬编码 `amber-500` 换成语义 `--warning` 令牌——但令牌本身就是 amber-500 亮度，对比度没变：
   - `text-warning` on `bg-warning/10` → **1.98:1 FAIL**（light）
   - `text-success` on `bg-success/10` → **2.61:1 FAIL**（light）
   - `text-destructive` on `bg-destructive/10` → **3.30:1**（仅大字）/ **1.92:1 FAIL**（dark, `--destructive: 0 62.8% 30.6%` 近黑红，dark 正文不可用）
   → 「Token 化但不验证对比度」= 看起来修了，实际上没修。

2. **庆祝浮层无键盘关闭/无语义（polish 未补完）**
   `page.client.tsx:208-236`：有 X 按钮+背景点击关闭，但 grep `Escape|role="dialog"|aria-modal` **全无**。浮层是裸 `<div>`，无法键盘关闭、无焦点陷阱、无焦点归还、不被读屏宣告。这是我「加了关闭按钮」后**未补的语义半截**。

3. **AgentProgress 重连耗尽后静默卡死（anti-freeze 部分回退）**
   我加了 `MAX_RECONNECT_ATTEMPTS=8` 限次重试——但耗尽后 `load()` 返回 null、轮询停止、重连横幅消失、`status` 仍 `RUNNING` → 用户看到 `Loader2` 永远转 + "still working" 文案，**无任何错误或重试入口**。重连耗尽与正常进度不可区分。这是我「防冻结」修复的半截。

4. **阅读视图无 `<h1>`**
   书标题是 `<span>`、空状态标题是 `<p>`、章节从 `<h2>` 起 → 标题层级从 2 级开始，读屏跳级。

5. **ENTER 修复之外的小漏洞**
   - `chat-box.tsx:78` 编辑取消的 X 按钮无 `aria-label`（修复自己的界面留无名控件）。
   - `chat-box.tsx:66` `form.setValue("prompt", message?.content!)`：编辑取消后 `message` 为 undefined，`!` 隐藏后把 undefined 写入受控字段，吞掉在草稿。

---

## 做得好的（本轮真实增益）

1. **阅读视图终于像书**——`w-[1000px] bg-secondary` → `w-full max-w-3xl mx-auto px-6 py-10` + `prose`，建立真实行宽；`<section id="chapter-{id}">` + `scroll-mt-24` 让大纲 FAB 的 scrollIntoView 落点正确；`.prose p` 修复全局灰字 bug。
2. **销毁需经同意，图标不再说谎**——`<Play>`→`<RotateCcw>` + AlertDialog（明确「This cannot be undone」）把偷袭变知情选择；编辑路径同款确认。对一个「章节 = 一小时迭代」的产品，这是从敌对到可信的关键一跃。
3. **自主生成本情绪可承受**——`aria-live` + `agentReassure` + 限次重连 + 退避；`agentReassure` 在正确时刻说真话。这是对「单进程 fire-and-forget」架构约束的正确 UX 补偿。

---

## 优先级问题（剩余）

### [P0] 启动页仍逼作者当 ML 工程师，且被复制
`app/(main)/components/BookOutlineForm.tsx`：`model` 必填、`{model.name}/{model.provider}` 裸内部 token、四个字段零 `FormLabel`、模式选中态 `bg-brand/5`（5% 透明）、Select 与 CTA 同行；此组件还在 `BookDialog.tsx` 重挂，缺陷同时出现在书架「创建」弹窗。注意：`labelTitle/labelDescription/labelCategory/labelModel/modelRecommended/advancedOptions` **键已存在 `app_en.json:96-101` 却无人用**——这是被搁置的半完工设计，非遗漏。
→ `distill`（再 `bolder` 做选中态）

### [P0] 看似能用实则不工作的控件（5 处静默失败）
- `setting-modal.tsx:59-63` `onSubmit` 仅 `console.log(data)` 且按钮在 `<SheetClose>` 内 → 表单关闭如已保存，无保存。
- `chat-box.tsx` `min(2)` 的 `<FormMessage/>` 被 `absolute inset-0` textarea 盖住 → 输 1 字回车静默无操作。
- `chats/[id]/page.client.tsx:53`、`content/[id]/page.client.tsx:49` `onError: console.log(e)` → 生成失败对用户不可见。
- `app/books/page.tsx` 搜索 Input 无 handler；网格/列表/New Book 按钮无 `onClick`。
- `Sidebar.tsx:44-61` `DRAFT/PUBLISHED/UNPUBLISHED` 为 `href="#"`，`AllBooks` `active` 硬编码 true。
→ `harden`

### [P1] 无障碍是「示范」而非系统
全仓库仅 **6 个 `aria-label`**（全部本轮新增）vs **16+ 个无名的 `size="icon"` 按钮**（含 `chat-log.tsx` 消息工具条 copy/edit/regenerate 与两处版本 stepper）。对比度实测：`--success`/`--warning`/`--destructive` 在 light 的 tint 上均 FAIL，dark `--destructive` **1.92:1**。`<html lang="en">` 静态（i18next 切到 zh 时读屏用错音库）。`tree/index.tsx` 在 treeitem 内嵌交互 Button。
→ `audit`

### [P1] 进度与状态讲错故事
- `api/book/[id]/agent/route.ts:58` `chaptersTotal: chapters.length`（含父节点）而 runner 只写叶子 → `pct` 数学上到不了 100%，却翻 `DONE`，进度条与成功横幅永久矛盾。
- `store/chapter.ts` 非持久化、挂载不读 `book.currentChapterId` → 刷新后 `chapter` 为 null，`appendMessage(chapter?.id!, …)` 传 undefined（AI 写时还在邀请「可关闭页面」）。
- `books/[id]/page.client.tsx:70-75` 空状态 CTA 标 `generateChat`（「Start Writing in Chat」）但 `href` 指向 `/agent` 自主进度页——标一个模式交付另一个。
→ `clarify`

### [P2] 聊天界面无作者声音 + 死重
`chat-log.tsx` 用户/AI 消息同排版；每条 AI 消息挂 `RefreashMessage` 模型下拉（选模型即 `removeMessagesAfterMessageId` 裸调、无确认，而相邻 edit 按钮有确认——同一销毁操作一处严谨一处裸奔）；`chapter-content.tsx` 死代码（`setActiveMessage` 永不传 message，其 `JSON.parse` try/catch 保护空对象）；`Reasoning` 是 `<div onClick>` 无 `role`/`tabIndex`/`aria-expanded`。
→ `layout`

### [P3] 现成的帮助系统无人可达
`app/docs/page.tsx` 是合格 4 步+FAQ，但全仓库搜 `/docs` 零链接；`Header` 仅 home/bookshelf/explore/subscription；`/explore` 渲染与 `/books` 相同的 `<Books/>`（登出也见空网格，名为探索实为重复书架）。
→ `document`

---

## 角色红旗（摘要）

- **Maya（想写书的作者）**：第 4 个字段遇「Select a LLM Model」列 `deepseek-r1/alibaba`，必填无默认；点示例 chip 会 `form.reset` **覆盖她刚写的标题/描述**；不知自己选了哪种模式（5% 透明）；完成即见「9/14 (64%)」伴「Generation complete!」；第三个示例是某国元首传记（商业 SaaS 首页一键 demo 风险默认）。
- **Sam（无障碍依赖者）**：6 个 aria-label vs 16+ 无名图标按钮；4 个状态色 3 个 FAIL，dark FAILED 横幅 **2.1:1**（错误态最不可读）；大纲树是 ARIA 陷阱；`lang="en"` 静态导致中文错音；仅 AgentProgress 两处 aria-live 可用。
- **Riley（压力测试者）**：刷新 `/content` 后发消息 → `chapter?.id!` 传 undefined 静默失败；输 1 字回车静默；Settings 改标题 Save 实为 `console.log`；畸形 outline 触发两套错误系统同时炸（`jsonParseError` toast + `GenerateErrorhandle` 裸栈）；书架工具条全 inert；模型下拉选即硬删下游。

---

## 次要观察（节选）
- `chat-box.tsx:66` `setValue(undefined)` 把受控变非受控（脆弱，应用 `form.reset()`）。
- `disabled={isStreaming}` 让作者 AI 写时不能构思下一句（30s+ 生成下效率损失大）。
- `ActiveLink` active 态 `bg-foreground/10` 在首页 `bg-brand` 下近不可见 → 首页 nav 无生效 active。
- `chat-header.tsx` `window.scroll` 监听叠在无条件 `border-b` 上无效（死代码，挂在 3 界面）。
- `Refreash.tsx:25` `border-teal-50` 全系统独此一处；`SignIn.tsx` 硬编码英文 + `text-red-500` 应为 `text-destructive`。
- `outline-preview.tsx` 标题 Input/内容 Textarea 无 `FormLabel` 无 `placeholder`。

---

## 需深思的问题
1. 启动表单有 3 个消费者（首页卡片/书架弹窗/SettingsModal），P1 #6 是否因「看似 3 个重设计」而搁置？修 `BookOutlineForm` 一次即同时修好前门、创建流、设置面。
2. 修复文案已写好却未接线——最后 40 行 JSX 为何比文案更难？
3. 你有两个「主色」（`--primary` 单色 vs `--brand` 靛蓝），到底哪个是 BookCraft？不定，延伸品牌色只增不一致。
4. docs 页描述的是 4 步旅程，比实际 nav（home/bookshelf/explore/subscription）更清晰——是否该让 docs 的步进模型成为 App nav？
5. `chaptersTotal` 计节点、runner 写叶子 → 自主模式**结构上无法报告成功**。百分比条是否对 instrument？是否改用「Chapter 9: 汉扩张 — writing…」+ 步进承载完成？
6. 本轮只守了编辑路径 AlertDialog，漏了 `RefreashMessage` 同款销毁——是否按「症状」而非「操作」划范围？建议审计所有 `removeMessagesAfterMessageId`/`clearMessageOfChapter` 调用点。
7. `.prose p` 通过覆盖全局 `p{text-muted-foreground}` 修好阅读对比度——但全局规则仍在默认调灰全站正文（含启动卡片模式描述）。muted-by-default 是否正确？还是阅读视图成了唯一因有人想到 opt-out 才可读的地方？
