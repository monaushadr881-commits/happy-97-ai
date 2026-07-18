# QUALITY GATE — R113 (Amended)

Every implementation PR MUST verify:

- [ ] No duplicate architecture (grep for `-v{N+1}` siblings).
- [ ] No duplicate tables (schema diff vs. existing 300+ tables).
- [ ] No duplicate APIs (grep server functions returning the same shape).
- [ ] No duplicate hooks (grep `use*` files).
- [ ] No duplicate contexts (grep `*Context.tsx`).
- [ ] Reuse existing systems — extend canonical owner in R111 §4.
- [ ] Typecheck passes (`tsgo`).
- [ ] All unit tests pass (Vitest).
- [ ] All e2e smoke tests pass (Playwright).
- [ ] Backward compatibility preserved.
- [ ] `TRACEABILITY_MATRIX.json` updated for the touched module(s).
- [ ] `FEATURE_REGISTRY.json` gets new stable IDs (never reuse).
- [ ] `FOUNDER_REGISTRY.md` untouched unless Founder Directive present.
