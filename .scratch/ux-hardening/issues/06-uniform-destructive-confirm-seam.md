# 06 — Uniform destructive confirm seam

**What to build:** every destructive message operation must go through the same confirmation path, so an author never loses downstream conversation by accident. A confirm AlertDialog already guards the edit-resend path; the model-change dropdown on an AI message still calls the destructive operation bare (no confirm), and chapter regeneration deletes downstream history. This ticket brings the model-change dropdown and chapter regen into the same seam and audits every `removeMessagesAfterMessageId` / `clearMessageOfChapter` call site to confirm none remain unguarded.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Changing a message's model confirms before deleting downstream messages (matching the edit path)
- [ ] Chapter regeneration confirms before clearing chapter history
- [ ] An audit confirms no bare `removeMessagesAfterMessageId` / `clearMessageOfChapter` call sites remain outside the confirm seam
