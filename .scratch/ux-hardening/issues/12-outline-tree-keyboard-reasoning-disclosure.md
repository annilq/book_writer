# 12 — Outline tree keyboard semantics + reasoning disclosure

**What to build:** the chapter outline tree must be keyboard-navigable with proper tree roles, and "reasoning" blocks must be real disclosure controls. Today the tree embeds interactive buttons inside tree items (an ARIA trap) and reasoning blocks are `<div onClick>` with no role, tabindex, or expanded state — unusable without a mouse and invisible to assistive tech. This ticket gives the tree `role="tree"` / `treeitem` with keyboard navigation and turns reasoning blocks into disclosure buttons with `aria-expanded`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The outline tree exposes `role="tree"` / `treeitem` with working keyboard navigation
- [ ] Reasoning blocks are disclosure buttons with `aria-expanded` reflecting their state
- [ ] No interaction relies on a bare `<div onClick>` without role / tabindex / expanded state
