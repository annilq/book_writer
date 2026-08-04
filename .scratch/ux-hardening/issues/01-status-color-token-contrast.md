# 01 — Status-color token contrast

**What to build:** status text used across the app (success, warning, destructive) must be readable on its tinted background in both light and dark themes. Today the tinted text shades fail WCAG AA (e.g. warning text on a 10% tint lands near 2:1), so generation state, error banners, and success markers are hard to read. This ticket darkens the status text shades (or flips to a solid background with light text) so the tokens themselves are correct — every surface that already uses these tokens inherits the fix for free.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Each status text token (success / warning / destructive) on its tinted background computes a contrast ratio ≥ 4.5:1 in light theme
- [ ] The same holds in dark theme (the dark destructive shade in particular currently fails near 1.9:1)
- [ ] Existing status surfaces (reconnection banner, error/failure banners, success markers, the completion celebration accents) need no further change to become readable
- [ ] A node test computes the contrast ratios from the token values and asserts the AA threshold in both themes
