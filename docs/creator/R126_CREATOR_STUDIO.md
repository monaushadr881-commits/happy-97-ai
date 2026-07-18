# R126 — HAPPY Creator Studio™

**Status:** Shipped (extension only; zero duplicate runtime).
**Locks:** R91 Vision · R111 Architecture · R113 Founder Constitution.

## Canonical Owners (extended, never replaced)

| Concern              | Canonical Owner |
|----------------------|-----------------|
| Creator OS APIs      | `src/lib/creator-v1.functions.ts` |
| Studio engine        | `src/lib/happy-studio/engine.ts` |
| Studio APIs          | `src/lib/happy-studio/studio.functions.ts` |
| AI Gateway           | Lovable AI (`LOVABLE_API_KEY`, server-only) |
| Files                | `src/lib/happy-r119/file-intelligence.ts` |
| Search               | `src/lib/happy-r120/search-intelligence.ts` |
| Brain                | `src/lib/brain/engine.ts` |
| Memory               | `src/lib/memory/engine.ts` |
| Workspace            | `src/lib/happy-r118/workspace-intelligence.ts` |
| Digital Human        | `src/components/digital-human/*`, R117 |

R126 adds one file — `src/lib/happy-r126/creator-intelligence.ts` — plus tests
and this doc. No new tables, APIs, routes, or runtimes.

## Gap Report → Fixes

| Gap                                              | Resolution |
|--------------------------------------------------|------------|
| No shared timeline helpers                       | `timelineDurationMs`, `normalizeTimeline`, `detectClipOverlaps` |
| Auto-subtitle logic was scattered                | `autoSubtitle` cue chunker |
| Preset math duplicated per component             | `renderPreset` (video) + `imagePreset` |
| Ad-hoc image model picks                         | `pickImageModel(kind, quality)` |
| Document scaffolds re-implemented in each UI     | `documentOutline(kind, topic)` |
| Audio enhancement chains inconsistent            | `audioChain(kind)` + `pickTtsVoice(persona)` |
| Hashtag / SEO / caption logic missing            | `generateHashtags`, `seoScore`, `summarizeForCaption`, `contentIdeas` |
| Brand kit validation & contrast checks missing   | `validateBrandKit`, `contrastRatio`, `brandContrastOk` |
| Publishing had no compliance layer               | `validatePublishPlan` (per-platform caption/hashtag/kind limits) |
| Calendar had no conflict/slot logic              | `detectCalendarConflicts`, `nextBestPublishSlot` |
| Analytics rollups duplicated                     | `engagementRate`, `watchTimeRatio`, `contentPerformance`, `creatorSnapshot` |
| Brain had no Creator resolver                    | `classifyCreatorIntent`, `intentToStudio`, `resolveForBrain` |
| DH had no Creator preset picker                  | `pickDhCreatorMode` |
| Roles/caps ungoverned                            | 7×9 `creatorCan(role, cap)` matrix |

## Architecture V2

- **Studio Runtime**: canonical `happy-studio/engine.ts` + `creator-v1.functions.ts`.
- **Editing Pipeline**: `capture → assemble → edit → enhance → review → render → publish` (pure `PipelineStage` type).
- **Rendering Pipeline**: `renderPreset` (video) + `imagePreset` fix output shape; upstream renderer stays canonical.
- **Publishing Pipeline**: `validatePublishPlan` enforces per-platform limits before any publish RPC is called.
- **AI Pipeline**: model selection helpers (`pickImageModel`, `pickTtsVoice`) — every AI call still flows through the AI Gateway server-side.
- **Media Pipeline**: File Engine (R119) owns storage; R126 never touches storage.

## Brain Integration

Stage-6 (retrieval) uses `resolveForBrain(query)` → returns `{studio, intent, route, suggestions}` — no new tables, no new APIs. Digital Human uses `pickDhCreatorMode` for mode selection (creator / presentation / teacher / marketing / brand).

## Permissions

7 roles × 9 caps: `viewer, contributor, editor, reviewer, publisher, brand_owner, admin` × `view, create, edit, render, publish, schedule, brand_manage, delete, analytics`.

## Publishing (architecture-ready)

All 8 platforms modeled (`youtube, instagram, facebook, linkedin, x, whatsapp, telegram, tiktok`) with caption/hashtag/kind limits. No credentials shipped; providers are gated by `secrets--add_secret` when the Founder activates them.

## Impact

- **Database:** none.
- **APIs:** none (extension helpers only).
- **Security:** publishing validator prevents malformed calls; no secrets touched.
- **Performance:** pure functions, deterministic, O(n log n) worst case.
- **Backward compatibility:** 100% — no existing symbol renamed or removed.

## Tests

`tests/unit/happy-r126.test.ts` — timeline, subtitle, presets, docs, audio, SEO,
brand, publishing, calendar, analytics, brain resolver, DH modes, permissions.

## Known Limitations / Remaining Work

- Native rendering (ffmpeg/GPU) and provider OAuth (YouTube, Meta, LinkedIn, X, TikTok) remain **BLOCKED-EXTERNAL** — activated the moment credentials land.
