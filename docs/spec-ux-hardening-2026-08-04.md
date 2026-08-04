# Spec: BookCraft Remaining UX Trust & Accessibility Hardening

<!-- triage: ready-for-agent -->
<!-- status: synthesized from /impeccable critique rerun (2026-08-04); score 21/40 Fair. Publishing to an external issue tracker requires `/setup-matt-pocock-skills` (no `gh`/tracker connected in this environment) — delivered locally until then. -->

This spec consolidates every remaining issue from the cross-surface critique re-run into one executable brief. It is intentionally broad (P0 → P3 clusters plus the defects the last round introduced or left behind) so an agent can close the gap from 21/40 toward a trustworthy baseline in a single pass. Domain terms follow `PRODUCT.md`: **Book**, **Chapter** (position-encoded hierarchy, e.g. `1.1.2`), **Message** (book-level for outline, chapter-level for editing), **AgentRun**, **dual-mode** (Autonomous / Chat / Manual), **outline tree**, **reading view**, **subscription gating**.

---

## Problem Statement

From the author's perspective: after the first hardening round, BookCraft's cross-surface UX moved from 14/40 to 21/40, but the product still fails to establish trust at the moments that matter.

- The **very first screen** a new author sees (the book-start form) still forces them to behave like an ML engineer — picking a provider/model token and reasoning about generation modes they never asked about.
- Several controls **appear to work but silently fail**: the settings "Save" is a `console.log`, the bookshelf toolbar has no handlers, and generation errors are swallowed.
- **Status and progress tell the wrong story**: the autonomous progress denominator counts parent chapters, so it can mathematically never reach 100% — yet the UI declares "Generation complete!".
- **Accessibility is only demonstrated** on a few screens we touched, not systemic across the app.
- A **working help page already exists but is unreachable** from any navigation.
- The last round's fixes also **introduced or left behind defects**: the status-color tokens still fail contrast (we tokenized but never verified), the completion celebration cannot be dismissed by keyboard, the agent progress silently freezes when reconnection attempts are exhausted, and the reading view has no `<h1>`.

The user wants all of this captured as one spec an agent can execute end-to-end.

---

## Solution

A single hardening pass across six clusters, prioritizing trust at **first-run** and at the **save / generate / complete** moments:

1. **Make the book-start form author-shaped.** The model becomes optional with a sensible default and is hidden behind an "Advanced options" disclosure; every field gets a visible label; the selected creation mode is clearly indicated; pre-filled examples never overwrite the author's own input. This one component is shared by the homepage card, the bookshelf "create" dialog, and settings — fixing it fixes the front door everywhere.
2. **Eliminate silent failures.** Settings actually persist; the bookshelf toolbar actions are wired or removed; generation errors surface to the user; every destructive message operation goes through the same confirmation path.
3. **Make progress and status truthful.** The autonomous progress denominator counts only leaf Chapters; refreshing a chapter view restores the current chapter from the Book; empty-state CTAs point at the mode they describe.
4. **Make accessibility systemic.** Fix the status-color tokens so tinted text meets contrast; add labels/roles to icon-only controls; set the document language dynamically; give the outline tree proper keyboard semantics.
5. **Complete the round-two fixes.** Give the completion celebration keyboard dismissal and dialog semantics; give the agent progress a real "reconnection failed" end state; add the missing `<h1>` to the reading view.
6. **Surface the existing help system** in the main navigation.

---

## User Stories

1. As an **Aspiring Author**, I want to start a book by giving only a title and a description, so that I am not forced to choose an LLM provider or model before I've written a word.
2. As an Aspiring Author, I want a recommended model to be pre-selected, so that I can generate immediately without understanding the model list.
3. As an Aspiring Author, I want advanced model/provider options to be tucked behind a disclosure, so that the first screen stays focused on my book idea.
4. As an Aspiring Author, I want every form field to have a visible label, so that I understand what each input expects.
5. As an Aspiring Author, I want the creation mode I pick (Autonomous vs Chat) to be clearly highlighted, so that I know which workflow I'm entering.
6. As an Aspiring Author, I want clicking a pre-filled example to fill the form without wiping what I've already typed, so that my own words aren't lost to a suggestion.
7. As an Aspiring Author, I want the example suggestions to avoid risky defaults (e.g. a head-of-state biography for a commercial one-click demo), so that the onboarding feels safe and appropriate.
8. As an Aspiring Author, I want the bookshelf "Create book" dialog to behave exactly like the homepage form, so that I get the same trustworthy experience wherever I start.
9. As a **Returning Author**, I want my settings changes to actually save when I click Save, so that I'm not misled into thinking a closed dialog means "saved".
10. As a Returning Author, I want the bookshelf search, grid/list toggle, and "New Book" controls to do something or be absent, so that I'm not clicking dead buttons.
11. As a Returning Author, I want generation failures to be shown to me as an error, so that a silent console log doesn't leave me staring at a stuck screen.
12. As a Returning Author, I want the sidebar entries to navigate to real destinations, so that "Drafts / Published / All books" aren't decorative `#` links.
13. As a Returning Author, I want form validation errors to be visible and not hidden behind the input, so that I know why my submit did nothing.
14. As an **Author in Chat mode**, I want confirmation before a destructive message action removes my downstream conversation, so that I never lose work by accident.
15. As an Author in Chat mode, I want the "regenerate / change model" control on an AI message to confirm before wiping downstream messages, just like the edit control does, so that destructive behavior is consistent everywhere.
16. As an Author reviewing a chapter, I want the autonomous progress to reach 100% exactly when generation is genuinely complete, so that the progress bar and the "complete" banner stop contradicting each other.
17. As an Author watching autonomous generation, I want the status to count only the chapters actually being written, so that the percentage reflects real work.
18. As an Author who refreshes the page mid-edit, I want my current chapter to be restored, so that I can keep writing instead of being dropped into a broken empty state.
19. As an Author at an empty-book state, I want the call-to-action to open the mode it advertises, so that "Start writing in chat" doesn't dump me into the autonomous progress page.
20. As an Author who finishes a whole book, I want the completion celebration to be dismissible with the keyboard (Escape, focus trap, focus return), so that I'm not trapped in an overlay.
21. As an Author watching autonomous generation, I want a clear "reconnection failed — retry" state when the connection can't be restored, so that a spinning loader doesn't lie to me forever.
22. As an Author reading my book, I want the book title to be a proper top-level heading and chapter titles to be second-level, so that screen readers and the document outline make sense.
23. As an **Accessibility-dependent user**, I want status text (success / warning / error) to meet contrast on its tinted background, so that I can read generation state without squinting.
24. As an Accessibility-dependent user, I want every icon-only button to have an accessible name, so that my screen reader announces what each control does.
25. As an Accessibility-dependent user, I want the page language to switch to Chinese when I'm in the zh locale, so that my screen reader uses the correct voice.
26. As an Accessibility-dependent user, I want the outline tree to be keyboard-navigable with proper tree roles, so that I can move between chapters without a mouse.
27. As an Accessibility-dependent user, I want "reasoning" disclosures to be real buttons with expanded state, so that I can toggle them with the keyboard and hear their state.
28. As an **Accessibility-dependent user**, I want the agent progress updates to be announced by my screen reader (aria-live), so that I know generation is progressing without watching the screen.
29. As a **First-time visitor**, I want to find the help / how-it-works page from the main navigation, so that I can learn the 4-step workflow without hunting.
30. As a First-time visitor, I want the "explore" surface to offer something distinct from my own bookshelf, so that the navigation doesn't feel like duplicated empty grids.
31. As an **Author in Chat mode**, I want my own messages and the AI's messages to look visually distinct, so that I can follow the conversation.
32. As an Author, I want the reasoning block to expand/collapse cleanly, so that I can skim without clutter.
33. As a **Power user**, I want the message toolbar (copy / edit / regenerate) to be reachable and labeled, so that I can act on messages efficiently.
34. As a **Stress tester**, I want畸形 (malformed) outline JSON to produce one clear, recoverable error rather than two error systems firing at once, so that I'm not confused by a stack dump.

---

## Implementation Decisions

- **Book-start form is a single shared component.** The homepage card, the bookshelf creation dialog, and the settings panel all mount the same form. Reworking it once fixes the front door everywhere; the advanced-model disclosure, field labels, mode-highlight, and example-fill behavior all live here. Existing i18n keys (`labelTitle`, `labelDescription`, `labelCategory`, `labelModel`, `modelRecommended`, `advancedOptions`) are already defined but unwired — wire them rather than mint new keys.
- **Model is optional with a default.** The form no longer requires a model; a recommended model is pre-selected and the selector moves into the "Advanced options" disclosure. Options render a friendly name + provider label, never the raw `provider/model` token.
- **Silent failures are removed, not hidden.** The settings panel persists through the real update path instead of logging; the bookshelf toolbar handlers are implemented or the controls are removed; generation `onError` callbacks surface a user-visible toast; sidebar entries become real routes. Validation messages render outside the input's absolute overlay so they are visible.
- **Destructive operations share one confirmation seam.** Every call to `removeMessagesAfterMessageId` / `clearMessageOfChapter` is gated by the same confirm path (the edit-path AlertDialog already established). The model-change dropdown on AI messages is brought into this seam rather than left as a bare call.
- **Progress is leaf-only and truthful.** The autonomous progress denominator is computed from leaf Chapters only (matching what the runner actually writes), so `pct` can reach 100% and the `DONE` transition is consistent with the bar. The chapter store hydrates from the Book's `currentChapterId` on mount so a refresh restores context. Empty-state CTAs align their label and destination to the same mode.
- **Accessibility is systemic, not decorative.**
  - Status-color text shades (`--success`, `--warning`, `--destructive`) are darkened (or flipped to solid background + light text) so tinted text meets AA (4.5:1) in both light and dark themes; the tokenization done in polish is verified, not assumed.
  - All `size="icon"` buttons get `aria-label`s; the outline tree gets `role="tree"`/`treeitem` with keyboard navigation; "reasoning" blocks become disclosure buttons with `aria-expanded`; the document `lang` is set dynamically from the active i18next locale.
- **Round-two defects are completed.**
  - The completion celebration becomes a real modal dialog: `role="dialog"`, `aria-modal`, Escape to close, focus trap on open, focus returned to trigger on close (the close button and backdrop click already exist; the semantics are added).
  - The agent progress, when reconnection attempts are exhausted, transitions to a `FAILED`/reconnect-failed state with an honest message and a manual retry affordance — no silent perpetual spinner.
  - The reading view renders the Book title as an `<h1>` and keeps Chapter titles as `<h2>`.
- **Help is reachable.** A link to the existing help/4-step page is added to the main navigation header.
- **Brand-token conflict is flagged, not resolved here.** The app currently has two competing "primary" colors (`--primary` monochrome vs `--brand` indigo). Extending brand usage without a decision only increases inconsistency; a product owner decision is recommended (see Further Notes). This spec does not introduce new color usage beyond what the fixes require.

---

## Testing Decisions

A good test here asserts **external behavior** (what the user sees and can do), not implementation internals. Modules to test and their preferred seams:

1. **Progress calculation (highest, purest seam).** Extract the autonomous progress logic into a pure function that takes the Chapter tree and returns `{ completed, total, pct, isComplete }` using **leaf-only** counting. Unit-test it with **vitest** (`node` environment) — this matches the existing prior art `utils/agent/outline.test.ts`. Cases: only-leaf vs parent-inclusive denominators; partial vs complete; the exact "stuck at 64% but DONE" regression.
2. **Book-start form submit contract.** Given a form state (title, description, optional model, mode), the submit produces a valid creation payload **without** requiring a model. (Component/DOM test — note the current vitest `environment` is `"node"`, so this needs `jsdom` added or a separate config; flag as a setup decision.)
3. **Chapter store hydration.** On mount the store reads the Book's `currentChapterId` so refresh restores the chapter; unit-test the store init.
4. **Status-color contrast.** A node test computes the contrast ratio of each status text token on its tint and asserts ≥ 4.5:1 in light and dark. (Token values are deterministic — computable without a browser.)
5. **Destructive-operation seam.** A code-level test or lint audit asserting every `removeMessagesAfterMessageId` / `clearMessageOfChapter` call site is gated by the confirm path (catches the model-dropdown regression automatically).
6. **Celebration dialog semantics.** Assert the overlay has `role="dialog"`, `aria-modal`, Escape handling, and focus return (DOM test, jsdom).
7. **Help discoverability.** Assert the help route is present in the rendered navigation.

**Prior art:** `utils/agent/outline.test.ts` (vitest, `node` env, `**/*.test.ts` include pattern). New tests should follow the same harness; the DOM/component seams (2, 6) require adding `jsdom` to the vitest environment — call this out as a prerequisite rather than skipping the coverage.

---

## Out of Scope

- **Architecture change** from single-process fire-and-forget to a queue/worker for autonomous generation (engineering decision tracked elsewhere, not a UX spec).
- **New visual world / rebrand.** Visual identity selection is deferred to `new-work`; this spec only fixes contrast and consistency within the incumbent system.
- **Auth provider expansion** (e.g. email/password, other OAuth) beyond the current GitHub OAuth constraint.
- **Full WCAG certification** or formal audit sign-off; this spec raises the baseline, it does not certify.
- **New product features** beyond the listed fixes (no new creation flows, no new AI capabilities).
- **Content/seed-data changes** beyond removing risky example defaults.

---

## Further Notes

- **Two "primary" colors.** `--primary` (Geist monochrome) and `--brand` (indigo) both mark "most important action" on different screens, and the recent brand extension has amplified the inconsistency. Recommend the product owner pick one true primary before further brand extension; until then, fixes avoid introducing new color usage.
- **Unused keys already exist.** `labelTitle` / `labelDescription` / `labelCategory` / `labelModel` / `modelRecommended` / `advancedOptions` are defined in `app_en.json`/`app_zh.json` but unwired — wire them; do not create duplicates.
- **Audit by operation, not symptom.** The edit path was confirmed but the model-dropdown destructive call was missed last round. Future hardening should enumerate every destructive call site by operation and confirm the seam uniformly.
- **Global muted text.** The global `p { text-muted-foreground }` rule still grays default body copy site-wide; the reading view only became readable because `.prose p` was overridden. Consider whether muted-by-default is correct, or whether the reading fix should become the default. Flag for the design owner.
- **Help page is good already.** `app/docs` is a solid 4-step + FAQ page; the only gap is a navigation link. No rewrite needed.
- **Publishing note.** This spec is marked `ready-for-agent`. To push it to an external issue tracker with that triage label, run `/setup-matt-pocock-skills` (not yet configured here — no `gh` binary and no connected tracker). Until then it lives at `docs/spec-ux-hardening-2026-08-04.md`.
