# 09 — Agent progress reconnection-failed end state

**What to build:** the autonomous progress view must have an honest end state when the connection cannot be restored. Today, after reconnection attempts are exhausted, the status stays "running" with a perpetual spinner and no error or retry path — indistinguishable from normal progress and effectively frozen. This ticket transitions to a clear "reconnection failed — retry" state with an honest message and a manual retry affordance.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] When reconnection attempts are exhausted, the view leaves the "running" state
- [ ] It shows an honest message that reconnection failed (not a perpetual spinner)
- [ ] It offers a manual retry affordance
- [ ] It does not silently freeze with no error and no recovery path
