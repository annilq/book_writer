# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Aspiring authors — people who have a book idea but lack a systematic method to turn it into a finished manuscript. They come to BookCraft with a title and a description (and sometimes a loose creative direction), and need AI to carry that intent all the way to a complete, structured book: an outline tree followed by per-chapter content. They are not necessarily professional writers; the product's job is to remove the structural and procedural gap between "I have an idea" and "I have a book."

Secondary audiences observed in the codebase but not yet confirmed as primary: content creators who may repurpose generated structure for ebooks/courses, and a general bilingual (zh/en) writing population spanning fiction, biography, history, philosophy, science, etc. (category list and example books live in i18n).

## Product Purpose

BookCraft is an AI-assisted book-writing platform. A user supplies a book title and description; the system generates a standardized creative prompt, then produces a full book — a hierarchical outline (chapters with position-encoded nesting) and, ultimately, per-chapter body text. Success means the user walks away with a complete, readable book they authored with AI, not a pile of disconnected chat snippets.

## Positioning

BookCraft's differentiating mechanism is a **book-length workflow with dual-mode control**. Unlike ad-hoc chat with a general LLM, it enforces a complete book structure (outline tree → chapters → content) and gives authors a choice of how much control to keep:

- **Autonomous mode** — submit once, the system generates the whole book in the background (fire-and-forget), and the user reviews the result.
- **Chat / Manual mode** — a conversational, per-chapter workflow where the author reviews and saves each section, keeping hands-on control.

A neighboring product (raw ChatGPT/Claude) cannot truthfully claim the same structured, book-length pipeline plus the explicit autonomous-vs-controlled toggle.

## Operating Context

- Two creation flows share the same data backbone: `Book` → `Chapter` (position-encoded hierarchy, e.g. "1.1.2") → `Message` (book-level for outline, chapter-level for editing) and `AgentRun` (autonomous task state).
- Autonomous generation writes body text directly to `chapter.content` (no `Message` rows); chat/manual mode writes `Message` rows and commits to `chapter.content` only on explicit save.
- The reading view (`/content/[id]`) falls back to `chapter.content` when no `Message` exists, so both modes render correctly.
- AI generation streams over SSE (`streamText` / `useChat`); autonomous progress is polled.
- Subscriptions gate access: plans, payment orders, and redemption codes, settled through Stripe and WeChat Pay webhooks.
- An admin backend manages users, subscription plans, orders, and redemption codes.
- A public "explore" surface lists published books.

## Capabilities and Constraints

Confirmed functionality:
- Book creation from title + description, with a standardized AI prompt.
- Dual-mode generation (autonomous one-click; chat-based per-chapter).
- Outline tree editing and per-chapter content generation/saving.
- Reading view for own and public books.
- Subscription system: plans, Stripe + WeChat Pay, redemption codes.
- Admin backend.
- Bilingual UI (zh / en, English is the fallback locale).

Constraints and explicitly undecided facts:
- **Auth is GitHub OAuth only** today. As a commercial SaaS this is a likely limitation (no email/password or other social providers), recorded as a current constraint rather than a decision to keep it forever.
- **Autonomous generation is single-process fire-and-forget** (per code comments, "production should move this to a queue/worker"); reliability at scale is an open engineering decision.
- **Chapter counting is inconsistent**: progress UI counts all chapters while the runner operates on leaf chapters only — a known defect, not a product decision.
- Model providers currently: OpenAI, DeepSeek, Ollama (OpenAI-compatible), Alibaba. Provider list is configurable, not fixed.

## Brand Commitments

- **Name:** BookCraft.
- **Tagline (existing, in code):** "Create your next masterpiece with the help of BookCraft."
- **Bilingual identity:** zh and en are first-class; the product is committed to serving both audiences.
- No binding visual style, palette, typography, or logo commitment was made by the user during init. The incumbent Geist/Vercel-style monochrome implementation exists in code but is treated as evidence, not a locked brand decision — visual world selection happens in new-work.

## Evidence on Hand

- Codebase: `/Users/yunqi/Documents/develop/book_writer` (Next.js 15 App Router, AI SDK v7, Prisma 7, PostgreSQL).
- Business guide: `BUSINESS_GUIDE.md` (documents flows A/B, data model, API map).
- Prior architecture analysis: `docs/architecture-analysis.md`.
- Public repo referenced in footer: `github.com/annilq/book_writer`.
- i18n example books (zh): 透过地理看历史, 美妙的数学, 毛泽东传 — indicate category breadth and a Chinese-reading audience sample.
- Absent and must not be fabricated: real testimonials, case studies, press, pricing specifics, or benchmark claims.

## Product Principles

1. **Structure over fragments.** Always deliver a complete book structure (outline tree → chapters), never loose chat output.
2. **Author control.** Dual-mode exists so authors can choose hands-off generation or hands-on, per-chapter refinement.
3. **Review before commit.** Generated content is reviewed and explicitly saved by the author before it becomes the book (especially in chat mode).
4. **Bilingual by default.** Serve zh and en audiences as a baseline, not an afterthought.
5. **Revenue through access.** Subscriptions (not one-off generation) are the commercial backbone; gating and payment are first-class.

## Accessibility & Inclusion

- Bilingual (zh/en) support is a product requirement, not optional.
- No formal WCAG level or specific assistive-technology commitment was established during init.
- As a commercial public SaaS, baseline web accessibility (keyboard navigation, sufficient contrast, readable typography) is an expected standard for future work, but no specific audit target was set.
