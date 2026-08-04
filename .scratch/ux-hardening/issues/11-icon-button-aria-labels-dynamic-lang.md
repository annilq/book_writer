# 11 — Icon-button aria-labels + dynamic document lang

**What to build:** every icon-only control must have an accessible name, and the document language must reflect the active locale. Today only a handful of controls have `aria-label`s while 16+ icon-only buttons (chat message toolbar copy/edit/regenerate, version steppers, the edit-cancel X) are unnamed, and `<html lang>` is hardcoded to "en" so a Chinese reader gets the wrong screen-reader voice. This ticket labels the unnamed controls and sets the document language dynamically from the active i18next locale.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The chat message toolbar buttons (copy / edit / regenerate) have accessible names
- [ ] The version steppers and the edit-cancel X button have accessible names
- [ ] No remaining icon-only button lacks an `aria-label`
- [ ] The document `lang` is set from the active i18next locale (switches between zh and en)
