# 05 — Eliminate dead controls

**What to build:** controls that appear to work but do nothing must either work or be removed. Three surfaces are affected: the bookshelf toolbar (search input, grid/list toggle, "New Book" button) has no handlers; the sidebar entries (Drafts / Published / Unpublished / All books) are `href="#"` decorative links; and form validation messages are rendered behind an absolutely-positioned textarea so a one-character submit fails silently with no visible reason. This ticket wires or removes the bookshelf and sidebar controls and lifts the validation message above the input overlay.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Bookshelf search filters the list, or the input is removed
- [ ] Bookshelf grid/list toggle and "New Book" button are functional, or removed
- [ ] Sidebar Drafts / Published / Unpublished / All books navigate to real routes (no `href="#"`)
- [ ] Form validation errors are visible and not hidden behind the input overlay
