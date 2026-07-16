# Performance Guide

## Budgets
| Metric | Target |
|---|---|
| LCP | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.1 |
| TBT | ≤ 200 ms |
| Route JS (gzip) | ≤ 180 kB |

## Rendering
- Route-level code splitting is automatic (do not export components).
- Loader → `ensureQueryData` → `useSuspenseQuery` — never `useEffect+fetch`.
- HAPPY stage is a persistent portal — zero re-mount on route change.

## Animation
- Single shared clock; per-frame allocations = 0.
- Quality tier auto-detected (R71.1); reduced-motion honored.

## Network / assets
- Preload the LCP image via route `head().links`.
- Prefer AVIF/WebP via `vite-imagetools` for bundled images.
- Fonts subset + `font-display: swap`.

## Scalability
Lovable Cloud instance size covers vertical scale. Horizontal patterns:
- Cache read-only public queries via `TO anon` policies + edge caching.
- Rate-limit `/api/public/*` at the handler.
- Realtime channels are per-user; scope subscriptions narrowly.
