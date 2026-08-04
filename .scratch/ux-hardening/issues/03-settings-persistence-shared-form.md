# 03 — Settings persistence on the shared form

**What to build:** when an author edits book metadata in the settings panel and clicks Save, the change must actually persist through the real update path. Today the Save handler only calls `console.log` and the button sits inside a sheet-close, so closing the panel creates the illusion of a saved change with nothing written. Built on top of the reworked shared form (ticket 02), this ticket wires the settings submit to the real persistence endpoint and removes the close-without-save antipattern.

**Blocked by:** 02 — Book-start form author-shaped (the settings panel mounts the same form; rework it first, then add persistence on top).

**Status:** ready-for-agent

- [ ] Clicking Save in settings persists the change so it survives a reload / is reflected server-side
- [ ] The Save button is no longer wrapped such that closing the sheet implies saving
- [ ] If the save fails, the error is surfaced to the author rather than swallowed
- [ ] The settings form inherits the author-shaped labels / mode highlight from ticket 02
