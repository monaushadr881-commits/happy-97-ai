# System Architecture

**Version:** R113 (Founder Draft v0)
**Locks:** R91 Vision Lock · R111 Architecture Lock · R113 Founder Constitution
**Status:** Living document — extend, never fork.

## Summary
Global system topology: TanStack Start + Vite 7 + React 19, Supabase (Lovable Cloud), Lovable AI Gateway, Cloudflare Worker runtime.

## Canonical Owners
See `docs/MASTER_ARCHITECTURE_LOCK.md` §4 for the single-owner list. Every change to this domain lands in the canonical owner.

## Prohibitions (from R111)
- No second runtime, second table, second API for this concern.
- No new `-v{N+1}` sibling files.
- No new schema without matching `GRANT` + RLS in the same migration.

## Traceability
See `docs/founder/TRACEABILITY_MATRIX.md` for Founder Module → Feature → Screen → Component → Hook → Server Fn → Table → Policy → Test mapping.
