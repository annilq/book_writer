# 10 — Reading view h1

**What to build:** the reading view must have a correct document heading hierarchy. Today the book title is a `<span>`, the empty-state heading is a `<p>`, and chapters start at `<h2>` — so the outline begins at level 2 and screen readers skip a level. This ticket renders the book title as a single `<h1>` and keeps chapter titles as `<h2>`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Exactly one `<h1>` (the book title) exists in the reading view
- [ ] Chapter titles render as `<h2>`
- [ ] The empty-state heading uses a proper heading element (not a `<p>`)
- [ ] The document outline is correct for assistive technology
