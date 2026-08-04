# 02 — Book-start form author-shaped

**What to build:** a new author should be able to start a book by supplying only a title and a description — never forced to choose an LLM provider or model. The shared book-start form (mounted by the homepage card, the bookshelf "create" dialog, and the settings panel) becomes author-shaped: the model is optional with a sensible recommended default and is tucked behind an "Advanced options" disclosure; every field gets a visible label; the chosen creation mode (Autonomous vs Chat) is clearly highlighted; clicking a pre-filled example fills the form without wiping what the author already typed; and the risky default example (a head-of-state biography for a commercial one-click demo) is removed. The already-defined i18n keys (`labelTitle`, `labelDescription`, `labelCategory`, `labelModel`, `modelRecommended`, `advancedOptions`) are wired in rather than duplicated.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Submitting with only title + description (no model selected) creates the book successfully
- [ ] A recommended model is pre-selected and the model selector is hidden behind an "Advanced options" disclosure
- [ ] Model options render a friendly name + provider label, never the raw `provider/model` token
- [ ] Every form field has a visible label
- [ ] The selected creation mode is visually distinct (not a ~5% opacity tint)
- [ ] Clicking a pre-filled example fills the form but preserves any text the author already entered
- [ ] No risky default example remains among the suggestions
- [ ] The same behavior applies in both the homepage card and the bookshelf create dialog (shared component)
