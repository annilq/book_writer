# 04 — Surface generation errors to the author

**What to build:** when AI generation fails (chat or content surface), the author must see a clear error instead of the failure being swallowed by a `console.log`. Today two generation error callbacks only log, leaving the author staring at a stuck or empty screen with no explanation. This ticket routes those failures to a user-visible toast / inline error.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] A failed generation in the chat surface shows a user-visible error (toast or inline)
- [ ] A failed generation in the content / chapter surface shows a user-visible error
- [ ] No generation error path relies solely on `console.log`
