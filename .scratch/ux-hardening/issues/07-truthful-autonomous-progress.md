# 07 — Truthful autonomous progress

**What to build:** the autonomous generation progress must tell the truth. Today the progress denominator counts parent chapters while the runner only writes leaf chapters, so the bar mathematically can never reach 100% even though the UI declares "Generation complete!" — a permanent contradiction. This ticket extracts the progress calculation into a pure function (testable in isolation), counts only leaf Chapters, restores the current chapter on refresh by hydrating the chapter store from the book's `currentChapterId`, and aligns the empty-state call-to-action with the mode it advertises.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The progress denominator counts leaf Chapters only
- [ ] The progress bar reaches 100% exactly when generation is genuinely complete (no "stuck at 64% but DONE")
- [ ] Refreshing the content view restores the current chapter from the book's `currentChapterId`
- [ ] The empty-book call-to-action's label and destination point at the same mode
- [ ] The progress calculation is a pure function with unit tests (vitest, node environment — prior art: `utils/agent/outline.test.ts`)
