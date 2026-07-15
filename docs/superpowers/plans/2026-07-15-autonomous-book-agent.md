# Autonomous Book Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an autonomous agent that, from the existing book form (title/category/description/model) with a "自主生成" toggle, runs the full pipeline (generate prompt → outline → per-chapter content) in a background task and streams progress, with no per-step user confirmation.

**Architecture:** A new `AgentRun` Prisma model records progress. A server-side orchestrator `utils/agent/runner.ts` reuses the existing prompt builders (`getOutlinePrompt`, `getStandardBookPrompt`), chapter persistence (`createBookOutline`, `saveChapterContent`), and model adapter (`getAIModel`), but uses `generateText` (non-streaming) so results can be captured and persisted. A new `app/api/book/[id]/agent` route starts the run (fire-and-forget) and exposes progress via GET polling. The form gains a toggle; a new progress page polls and renders the step bar + log + chapter completion.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Prisma 7 + PostgreSQL, AI SDK v5 (`ai`), Zod, LangChain (`@langchain/core` StructuredOutputParser), Vitest (unit tests), Tailwind + Radix (shadcn `switch`).

## Global Constraints

- Next.js 15: **route handler & page `params` are a `Promise`** — must `await params` and type as `{ params: Promise<{ id: string }> }`.
- Reuse, don't duplicate: `getOutlinePrompt` (`utils/prompts/index.ts:102`), `getStandardBookPrompt` (`utils/prompts/index.ts:19`), `extractJsonCodeFromMarkdown` (`utils/index.ts:61`), `flattenChaptersWithPosition` (`utils/index.ts:213`), `createBookOutline` (`app/api/chat/actions.ts:163`), `saveChapterContent` (`app/api/chapter/actions.ts:106`), `getAIModel` (`utils/ai_providers/index.ts`).
- i18n: chapter prompt uses `bookChapterPrompt`; outline prompt uses `bookOutlinePrompt`. Both confirmed present in `utils/i18n/app_en.json`.
- After generation the book stays `DRAFT` — **no auto-publish**.
- The runner runs **single-process, fire-and-forget** (dev ok). Note in code comment that production needs a queue/worker.
- API responses use `appResponse` (`utils/response.ts`) → `{ code, data, info }`; client must read `.data`.

---

## File Structure

- **Create** `prisma/schema.prisma` (edit): add `AgentRunStatus` enum + `AgentRun` model.
- **Create** `utils/agent/outline.ts`: pure outline parser `parseOutlineToChapterInputs` + `ChaptersSchema` (single source of truth).
- **Modify** `utils/prompts/index.ts`: import `ChaptersSchema` from `utils/agent/outline` instead of redefining (keeps one schema).
- **Create** `vitest.config.ts`: path alias `@` → repo root, node env.
- **Modify** `package.json`: add `"test": "vitest run"` script.
- **Create** `utils/agent/outline.test.ts`: unit tests for `parseOutlineToChapterInputs`.
- **Create** `utils/agent/runner.ts`: `generateChapterContent`, `runAutonomousBook`, `updateRun`.
- **Create** `app/api/book/[id]/agent/route.ts`: `POST` (start) + `GET` (progress).
- **Modify** `app/(main)/components/BookOutlineForm.tsx`: add "自主生成" `Switch` + branch submit to agent flow.
- **Create** `app/books/[id]/agent/page.tsx`: server wrapper passing `bookId`.
- **Create** `app/books/[id]/agent/AgentProgress.tsx`: client polling + progress UI.

---

### Task 1: Prisma — AgentRun model

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `prisma.agentRun` client (after generate), enum `AgentRunStatus`.

- [ ] **Step 1: Add enum + model to schema**

Append to `prisma/schema.prisma` (near other enums/business models):

```prisma
enum AgentRunStatus {
  RUNNING
  DONE
  FAILED
}

model AgentRun {
  id          String         @id @default(nanoid(16))
  bookId      String         @unique
  book        Book           @relation(fields: [bookId], references: [id], onDelete: Cascade)
  status      AgentRunStatus @default(RUNNING)
  currentStep String         @default("PROMPT")
  log         Json?
  error       String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

- [ ] **Step 2: Generate client + push schema**

Run:
```bash
npx prisma generate && npx prisma db push
```
Expected: `Generated Prisma Client`, and `AgentRun` table created (no data loss warning for new table).

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add AgentRun model for autonomous book generation"
```

---

### Task 2: Vitest config + test script

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run test` / `yarn test` runner.

- [ ] **Step 1: Write config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Add script to package.json**

In `package.json` `scripts`, add:
```json
"test": "vitest run"
```

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts package.json
git commit -m "chore: add vitest config and test script"
```

---

### Task 3: Write the failing outline-parser test

**Files:**
- Create: `utils/agent/outline.test.ts`

**Interfaces:**
- Consumes: `parseOutlineToChapterInputs(text: string): ChapterInput[]` (to be created in Task 4).
- Produces: nothing yet (test only).

- [ ] **Step 1: Write the test**

Create `utils/agent/outline.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseOutlineToChapterInputs } from "@/utils/agent/outline";

const sample = `Here is the outline:
\`\`\`json
[
  {
    "id": "chap01",
    "title": "Introduction",
    "description": "A sufficiently long description explaining the purpose of this intro chapter.",
    "children": [
      {
        "id": "chap01a",
        "title": "Background",
        "description": "A sufficiently long description providing necessary background context for readers.",
        "children": []
      }
    ]
  }
]
\`\`\``;

describe("parseOutlineToChapterInputs", () => {
  it("parses a markdown json outline into a ChapterInput tree", () => {
    const result = parseOutlineToChapterInputs(sample);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Introduction");
    expect(result[0].position).toBe("");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children?.[0].title).toBe("Background");
  });

  it("throws when no json block is present", () => {
    expect(() => parseOutlineToChapterInputs("no outline here")).toThrow();
  });

  it("validates min description length", () => {
    const bad = `\`\`\`json\n[{"id":"x","title":"T","description":"short","children":[]}]\n\`\`\``;
    expect(() => parseOutlineToChapterInputs(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run utils/agent/outline.test.ts`
Expected: FAIL — `Cannot find module '@/utils/agent/outline'`.

- [ ] **Step 3: Commit (failing test, red)**

```bash
git add utils/agent/outline.test.ts
git commit -m "test: add failing tests for outline parser"
```

---

### Task 4: Implement outline parser + reuse schema in prompts

**Files:**
- Create: `utils/agent/outline.ts`
- Modify: `utils/prompts/index.ts`

**Interfaces:**
- Produces: `parseOutlineToChapterInputs(text): ChapterInput[]`, `ChaptersSchema`, `ChapterModel` (consumed by `getOutlinePrompt` and the runner).

- [ ] **Step 1: Create the parser module**

Create `utils/agent/outline.ts`:

```ts
import { z } from "zod";
import { extractJsonCodeFromMarkdown, type ChapterInput } from "@/utils";

export const ChapterModel: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(5),
    title: z.string().min(3),
    description: z.string().min(20),
    children: z.array(ChapterModel),
  })
);

export const ChaptersSchema = z.array(ChapterModel);

function toChapterInput(nodes: any[]): ChapterInput[] {
  return nodes.map((node) => ({
    title: node.title,
    description: node.description,
    position: "",
    children:
      node.children && node.children.length ? toChapterInput(node.children) : undefined,
  }));
}

export function parseOutlineToChapterInputs(outlineText: string): ChapterInput[] {
  const blocks = extractJsonCodeFromMarkdown(outlineText);
  if (!blocks.length) throw new Error("No JSON outline found in model output");
  const parsed = ChaptersSchema.parse(blocks[0]);
  return toChapterInput(parsed);
}
```

- [ ] **Step 2: Refactor `getOutlinePrompt` to reuse the schema**

In `utils/prompts/index.ts`, remove the locally-defined `ChapterModel`/`ChaptersSchema` and import from the new module. Replace lines 102-111 region:

```ts
import { dedent } from "dedent";
import { FormSchema } from "@/app/(main)/components/BookOutlineForm";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { Book } from "@prisma/client";
import { ChaptersSchema } from "@/utils/agent/outline";

export function getOutlinePrompt(book: Book) {
  const systemPrompt = dedent`
 You are now a professional writer. You can create a book outline based on the information the user provides.
      # General Instructions
        ${book.prompt}
      # Format Instructions:
        ${StructuredOutputParser.fromZodSchema(ChaptersSchema).getFormatInstructions()}
      # Write with Language: ${book.language}
    `;
  return systemPrompt;
}
```

(The rest of `utils/prompts/index.ts` — `chapterPrompt`, `getStandardBookPrompt` — stays unchanged.)

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run utils/agent/outline.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add utils/agent/outline.ts utils/prompts/index.ts
git commit -m "feat(agent): add outline parser and reuse schema in prompts"
```

---

### Task 5: Runner orchestrator

**Files:**
- Create: `utils/agent/runner.ts`

**Interfaces:**
- Consumes: `getAIModel` (`utils/ai_providers`), `getOutlinePrompt` (`utils/prompts`), `parseOutlineToChapterInputs` (`utils/agent/outline`), `createBookOutline` (`app/api/chat/actions`), `saveChapterContent` (`app/api/chapter/actions`), `getI18n` (`utils/i18n/server`), `getPrisma` (`utils/prisma`), `generateText` (`ai`).
- Produces: `runAutonomousBook(bookId: string): Promise<void>`, `generateChapterContent(chapterId, model, book): Promise<string>`.

- [ ] **Step 1: Write the runner**

Create `utils/agent/runner.ts`:

```ts
import { generateText } from "ai";
import { getAIModel } from "@/utils/ai_providers";
import { getOutlinePrompt } from "@/utils/prompts";
import { parseOutlineToChapterInputs } from "@/utils/agent/outline";
import { createBookOutline } from "@/app/api/chat/actions";
import { saveChapterContent } from "@/app/api/chapter/actions";
import { getI18n } from "@/utils/i18n/server";
import { getPrisma } from "@/utils/prisma";
import { Book, Chapter } from "@prisma/client";

type RunLogEntry = { ts: string; step: string; message: string };

async function updateRun(bookId: string, step: string, message: string) {
  const prisma = getPrisma();
  const run = await prisma.agentRun.findUnique({ where: { bookId } });
  const log = (run?.log as RunLogEntry[] | undefined) ?? [];
  log.push({ ts: new Date().toISOString(), step, message });
  await prisma.agentRun.update({
    where: { bookId },
    data: { currentStep: step, log },
  });
}

export async function generateChapterContent(
  chapterId: number,
  model: string,
  book: Book & { chapters: Chapter[] }
) {
  const [provider, modelName] = model.split("/");
  const i18n = getI18n(book.language);
  const systemPrompt = `${i18n.t("bookChapterPrompt")}
      # General Instructions
        ${book.prompt}
      # Outline
        ${JSON.stringify(book.chapters)}
      # Write with Language: ${book.language}
    `;
  const result = await generateText({
    model: getAIModel(provider, modelName),
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0,
  });
  await saveChapterContent(chapterId, result.text);
  return result.text;
}

export async function runAutonomousBook(bookId: string) {
  const prisma = getPrisma();
  const run = await prisma.agentRun.findUnique({ where: { bookId } });
  if (!run) return;

  try {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { chapters: { orderBy: { position: "asc" } } },
    });
    if (!book) throw new Error("Book not found");

    // PROMPT stage: book.prompt already generated by createBook
    await updateRun(bookId, "PROMPT", "Standard prompt ready");

    // OUTLINE stage
    await updateRun(bookId, "OUTLINE", "Generating outline...");
    const [pProvider, pModel] = book.model.split("/");
    const outlineResult = await generateText({
      model: getAIModel(pProvider, pModel),
      messages: [{ role: "system", content: getOutlinePrompt(book) }],
      temperature: 0,
    });
    const chapterInputs = parseOutlineToChapterInputs(outlineResult.text);
    await createBookOutline(bookId, chapterInputs);

    // CHAPTER stage
    const leafChapters = await prisma.chapter.findMany({
      where: { bookId, leaf: true },
      orderBy: { position: "asc" },
    });
    for (let i = 0; i < leafChapters.length; i++) {
      await updateRun(
        bookId,
        `CHAPTER:${i + 1}/${leafChapters.length}`,
        `Writing chapter: ${leafChapters[i].title}`
      );
      await generateChapterContent(leafChapters[i].id, book.model, {
        ...book,
        chapters: leafChapters,
      });
    }

    await prisma.book.update({ where: { id: bookId }, data: { step: "COMPLETE" } });
    await prisma.agentRun.update({
      where: { bookId },
      data: { status: "DONE", currentStep: "COMPLETE" },
    });
  } catch (e: any) {
    await prisma.agentRun.update({
      where: { bookId },
      data: { status: "FAILED", error: e?.message ?? "Unknown error" },
    });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new type errors for `utils/agent/runner.ts`.

- [ ] **Step 3: Commit**

```bash
git add utils/agent/runner.ts
git commit -m "feat(agent): add background runner orchestrating prompt/outline/chapters"
```

---

### Task 6: API route to start + query the run

**Files:**
- Create: `app/api/book/[id]/agent/route.ts`

**Interfaces:**
- Consumes: `auth` (`auth.ts`), `getPrisma`, `appResponse` (`utils/response`), `runAutonomousBook` (`utils/agent/runner`).
- Produces: `POST /api/book/[id]/agent` → `{ runId }`; `GET` → `{ run, bookStep, chaptersTotal, chaptersDone }`.

- [ ] **Step 1: Write the route**

Create `app/api/book/[id]/agent/route.ts`:

```ts
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getPrisma } from "@/utils/prisma";
import { appResponse } from "@/utils/response";
import { runAutonomousBook } from "@/utils/agent/runner";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookId } = await params;
  return appResponse(async () => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const prisma = getPrisma();
    const existing = await prisma.agentRun.findUnique({ where: { bookId } });
    if (existing && existing.status !== "FAILED") {
      throw new Error("Agent run already in progress for this book");
    }
    // Retry: clear previous run and its chapters, then re-run from scratch.
    if (existing) {
      await prisma.chapter.deleteMany({ where: { bookId } });
      await prisma.agentRun.delete({ where: { bookId } });
    }

    const run = await prisma.agentRun.create({
      data: { bookId, status: "RUNNING" },
    });

    // Fire-and-forget background execution (single process).
    // NOTE: production should move this to a queue/worker.
    runAutonomousBook(bookId).catch((e) => console.error("agent run failed", e));

    return { runId: run.id };
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookId } = await params;
  return appResponse(async () => {
    const prisma = getPrisma();
    const run = await prisma.agentRun.findUnique({ where: { bookId } });
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    const chapters = await prisma.chapter.findMany({ where: { bookId } });
    const chaptersDone = chapters.filter((c) => c.content && c.content.length > 0).length;
    return {
      run,
      bookStep: book?.step,
      chaptersTotal: chapters.length,
      chaptersDone,
    };
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/book/[id]/agent/route.ts
git commit -m "feat(api): add agent start/query route for autonomous book generation"
```

---

### Task 7: Form "自主生成" toggle

**Files:**
- Modify: `app/(main)/components/BookOutlineForm.tsx`

**Interfaces:**
- Consumes: existing `createBook` server action (`app/api/chat/actions`), new `POST /api/book/[id]/agent`.
- Produces: when toggle on, creates the book and starts the agent, then navigates to the progress page.

- [ ] **Step 1: Add imports + state**

In `BookOutlineForm.tsx`, add to the existing imports:
```ts
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation"; // already imported as useRouter
import crypto from "crypto";
```
(Keep existing `useRouter` import; add `Switch` and `crypto`. Also import `createBook` — it is already imported from `@/app/api/chat/actions`.)

Add state near the other `useState` calls:
```ts
const [autonomous, setAutonomous] = useState(false);
```

- [ ] **Step 2: Add the submit branch**

Modify `handleSubmit` so it accepts an `autonomous` flag and, when true, skips `useChat` and starts the agent. Replace the current `handleSubmit` body with:

```tsx
const handleSubmit = async (
  data: z.infer<typeof FormSchema>,
  autonomousFlag = false
) => {
  setLoading(true);
  const { model, categories, description, title } = data;

  try {
    if (autonomousFlag) {
      const book = await createBook({
        id: crypto.randomUUID(),
        title,
        model,
        description,
        language: i18n.language,
        categories,
      });
      await fetch(`/api/book/${book.id}/agent`, { method: "POST" });
      setLoading(false);
      startTransition(() => {
        router.push(`/books/${book.id}/agent`);
      });
      return;
    }

    // --- existing chat flow (unchanged) ---
    const chat = await createBook({
      id,
      title,
      model,
      description,
      categories,
      language: i18n.language,
    });
    setLoading(false);
    if (chat) {
      setMessages((chat.messages || []).map((msg) => ({
        id: msg.id,
        role: msg.role as "data" | "system" | "user" | "assistant",
        content: msg.content,
      })));
      reload({ body: { chat, model: chat.model, chatId: chat.id, book: chat } });
      startTransition(() => {
        router.push(`/chats/${chat?.id}`);
      });
    }
  } catch (e) {
    setLoading(false);
    console.error(e);
  }
};
```

- [ ] **Step 3: Wire the toggle UI + onSubmit**

Add a `Switch` control above the form (e.g. just inside the returned `<div className="w-full">`), and pass `autonomous` into `onSubmit`:

```tsx
{/* autonomous toggle */}
<div className="flex items-center justify-between px-6 pb-2">
  <span className="text-sm font-medium">{t("autonomous") ?? "自主生成（无需逐步确认）"}</span>
  <Switch checked={autonomous} onCheckedChange={setAutonomous} />
</div>
```

And update `onSubmit` to forward the flag:
```tsx
async function onSubmit(data: z.infer<typeof FormSchema>) {
  toast({ title: autonomous ? "Generating book autonomously, please wait..." : "Generating book info, this will spend some time, please wait a moment" });
  await handleSubmit(data, autonomous);
}
```

(If `t("autonomous")` is missing from i18n json, add `"autonomous": "Autonomous generation (no step-by-step confirmation)"` to `utils/i18n/app_en.json` and the zh file.)

- [ ] **Step 4: Type-check + Commit**

Run: `npx tsc --noEmit`
Expected: no new type errors.

```bash
git add app/'(main)'/components/BookOutlineForm.tsx utils/i18n/app_en.json utils/i18n/app_zh.json
git commit -m "feat(ui): add autonomous generation toggle to book form"
```

---

### Task 8: Progress page + client poller

**Files:**
- Create: `app/books/[id]/agent/page.tsx`
- Create: `app/books/[id]/agent/AgentProgress.tsx`

**Interfaces:**
- `page.tsx` (server): resolves `params.id`, renders `<AgentProgress bookId={id} />`.
- `AgentProgress.tsx` (client): polls `GET /api/book/[id]/agent` every 2s, renders step bar, log timeline, chapter progress; on `DONE` links to `/content/[id]`; on `FAILED` shows error + retry button (POST).

- [ ] **Step 1: Server wrapper**

Create `app/books/[id]/agent/page.tsx`:

```tsx
import AgentProgress from "./AgentProgress";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgentProgress bookId={id} />;
}

export const maxDuration = 60;
```

- [ ] **Step 2: Client progress component**

Create `app/books/[id]/agent/AgentProgress.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type RunStatus = "RUNNING" | "DONE" | "FAILED";
type RunLogEntry = { ts: string; step: string; message: string };
type Run = {
  status: RunStatus;
  currentStep: string;
  log: RunLogEntry[] | null;
  error: string | null;
};
type Progress = {
  run: Run | null;
  bookStep: string | null;
  chaptersTotal: number;
  chaptersDone: number;
};

const STEPS = ["PROMPT", "OUTLINE", "CHAPTER", "COMPLETE"];

export default function AgentProgress({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/book/${bookId}/agent`);
    const json = await res.json();
    if (json.code === 0) setProgress(json.data as Progress);
  }, [bookId]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      await load();
      if (active) setTimeout(tick, 2000);
    };
    tick();
    return () => {
      active = false;
    };
  }, [load]);

  const retry = async () => {
    await fetch(`/api/book/${bookId}/agent`, { method: "POST" });
    load();
  };

  const status = progress?.run?.status;
  const currentStep = progress?.run?.currentStep ?? "";
  const done = progress?.chaptersDone ?? 0;
  const total = progress?.chaptersTotal ?? 0;

  return (
    <div className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-2xl font-bold">自主生成进度</h1>

      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((s) => {
          const active = currentStep.startsWith(s);
          const finished =
            s === "COMPLETE" ? status === "DONE" : STEPS.indexOf(s) < STEPS.indexOf(currentStep.replace(/:\d+\/\d+/, "") as any);
          return (
            <span
              key={s}
              className={`px-3 py-1 rounded-full text-sm border ${
                active ? "bg-primary text-primary-foreground" : finished ? "bg-green-100" : "bg-muted"
              }`}
            >
              {s}
            </span>
          );
        })}
      </div>

      {status === "FAILED" && (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <span>{progress?.run?.error ?? "Generation failed"}</span>
          <Button variant="outline" onClick={retry}>重试</Button>
        </div>
      )}

      {status === "DONE" && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span>生成完成！</span>
          <Button onClick={() => router.push(`/content/${bookId}`)}>查看书籍</Button>
        </div>
      )}

      {status === "RUNNING" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{currentStep}</span>
        </div>
      )}

      {total > 0 && (
        <div className="text-sm text-muted-foreground">
          章节完成度：{done} / {total}
        </div>
      )}

      <div className="border rounded-md p-4 h-64 overflow-auto text-sm space-y-1 bg-muted/30">
        {(progress?.run?.log ?? []).map((e, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</span>
            <span className="font-mono text-xs">{e.step}</span>
            <span>{e.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + Commit**

Run: `npx tsc --noEmit`
Expected: no new type errors.

```bash
git add app/books/'[id]'/agent/page.tsx app/books/'[id]'/agent/AgentProgress.tsx
git commit -m "feat(ui): add autonomous generation progress page with polling"
```

---

### Task 9: End-to-end manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start dev environment**

Ensure Postgres is up and env vars (`DATABASE_URL`, `AUTH_GITHUB_ID/SECRET`, model API keys) are set, then:
```bash
npx prisma generate && npx prisma db push
yarn dev
```

- [ ] **Step 2: Run unit tests**

Run: `npx vitest run`
Expected: outline parser tests PASS.

- [ ] **Step 3: Exercise the autonomous flow**

1. Open `/`, fill title/description/category/model, toggle **自主生成**, submit.
2. Confirm redirect to `/books/<id>/agent` and the step bar advances `PROMPT → OUTLINE → CHAPTER:n/m → COMPLETE`.
3. In a DB shell / Prisma Studio, confirm: `AgentRun.status = DONE`, `Book.step = COMPLETE`, `Book.prompt` populated, `Chapter` rows exist with non-empty `content`, `Book` remains `DRAFT`.
4. Reload the page mid-run to confirm progress polling resumes from DB (not lost).
5. Test failure path: temporarily point the model to an invalid id, submit, confirm `AgentRun.status = FAILED` with an `error`, then click **重试** and confirm it recovers.

- [ ] **Step 4: Final commit (if any tweaks were needed)**

```bash
git add -A
git commit -m "chore: finalize autonomous book agent (verification tweaks)"
```

---

## Self-Review Notes (applied)

- **Spec coverage:** AgentRun model ✅ (T1), runner ✅ (T5), API start/query ✅ (T6), form toggle ✅ (T7), progress page ✅ (T8), retry/reset ✅ (T6+T8), reuse of existing prompts/actions ✅ (T4/T5), book stays DRAFT ✅ (T5 sets only `step`, never `status`).
- **Placeholder scan:** no TBD/TODO; every code step has concrete code.
- **Type consistency:** `parseOutlineToChapterInputs` returns `ChapterInput[]` matching `createBookOutline` signature; `generateChapterContent` signature matches its call in `runAutonomousBook`; `agentRun` lowercase client name used consistently; route `params` typed as `Promise<{id:string}>` everywhere.
- **Single schema source:** `ChaptersSchema` now defined once in `utils/agent/outline.ts` and imported by `utils/prompts` (T4) — no duplicate definition.
