# 08 — Completion celebration modal semantics

**What to build:** when a whole book finishes, the celebration overlay must be a proper, keyboard-dismissable modal. Today it has a close button and backdrop click but no dialog role, no `aria-modal`, no Escape handling, no focus trap, and no focus return — an author can be trapped and a screen reader is never told it opened. This ticket adds the dialog semantics and keyboard affordances.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The overlay has `role="dialog"` and `aria-modal="true"`
- [ ] Pressing Escape dismisses the overlay
- [ ] Focus is trapped inside the overlay while open and returns to the trigger on close
- [ ] The existing close button and backdrop-click dismissal continue to work
