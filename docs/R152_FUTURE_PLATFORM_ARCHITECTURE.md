# R152 — Future Platform & Avatar Architecture

**Status:** ARCHITECTURE READY. No new runtimes. No renderer / brain / memory / workspace / conversation V2.
**Locks:** R91 · R111 · R145 · R151.

## Canonical Owners (unchanged)

| Concern | Owner |
|---|---|
| Brain | `src/brain/kernel.ts` |
| Memory | `src/lib/memory/intelligence.ts` |
| Workspace | `src/workspace/` |
| Conversation | `src/lib/happy-runtime/conversation.ts` |
| Digital Human Runtime | `src/components/digital-human/HappyVRM.tsx` + `src/lib/happy-runtime/digital-human.ts` |
| **Avatar Engine (NEW contract)** | `src/lib/happy-r152/avatar-engine.ts` |

## What R152 Adds (architecture only)

1. **Canonical Avatar Engine** (`avatar-engine.ts`) — 16-method interface:
   `initialize · load · unload · render · speak · listen · animate · gesture ·
   emotion · expression · lookAt · move · teleport · present · whiteboard · shutdown`.
   Every renderer (VRM, MetaHuman, Live2D, NVIDIA ACE, plugin) MUST implement it.
2. **Renderer Registry** — VRM (PRIMARY), MetaHuman / Live2D / NVIDIA ACE (ARCHITECTURE READY), Generic Plugin Slot.
   Duplicate registrations under an existing id are rejected (V2 ban enforced in code).
3. **Platform Runtime Registry** (`platform-registry.ts`) — Web (active), Android/iOS (arch-ready),
   Windows/macOS/Linux/Vision Pro/XR (pending). Every entry reuses the canonical owners; the registrar
   throws if a platform tries to fork Brain/Memory/Workspace/Conversation/Digital Human.
4. **XR Abstraction** (`xr.ts`) — AR / VR / MR adapter contracts with hand-tracking, eye-tracking,
   voice, spatial anchors, and environment mapping. Ships with `stubXRAdapter` that throws loudly.
5. **MetaHuman / NVIDIA ACE / Live2D Bridges** (`bridges/*.ts`) — hook-only interfaces that map onto the
   canonical AvatarEngine. No SDK imports; no runtime duplication.
6. **Unified Asset Registry** (`asset-registry.ts`) — VRM, MetaHuman, Live2D, Animations, Expressions,
   Voice Packs, Environment Packs, Camera Presets, BMW Entry, Presentation, Whiteboard.

## Files Changed

- `src/lib/happy-r152/avatar-engine.ts` (new)
- `src/lib/happy-r152/platform-registry.ts` (new)
- `src/lib/happy-r152/xr.ts` (new)
- `src/lib/happy-r152/asset-registry.ts` (new)
- `src/lib/happy-r152/bridges/metahuman.ts` (new)
- `src/lib/happy-r152/bridges/nvidia-ace.ts` (new)
- `src/lib/happy-r152/bridges/live2d.ts` (new)
- `src/lib/happy-r152/index.ts` (new)
- `tests/unit/happy-r152.test.ts` (new)
- `docs/founder/FOUNDER_REGISTRY.md` (append: FM514–FM520)
- `docs/founder/FOUNDER_DECISIONS.md` (append: R152 decisions)
- `docs/R152_FUTURE_PLATFORM_ARCHITECTURE.md` (this file)

## Non-Duplication Verification

- ONE Brain — `src/brain/kernel.ts` (unchanged).
- ONE Memory — canonical Memory Intelligence owner (unchanged).
- ONE Workspace — `src/workspace/` (unchanged).
- ONE Conversation — canonical conversation engine (unchanged).
- ONE Digital Human Runtime — `HappyVRM.tsx` + `happy-runtime/digital-human.ts` (unchanged).
- ONE Avatar Engine — introduced in R152; every renderer must implement it.

Runtime guards enforce the "extend, don't fork" rule at registration time.

## Impact

- **Architecture:** +1 contract layer (Avatar Engine) atop existing DH runtime. Zero changes to existing runtimes.
- **Performance:** Zero. Registries are pure in-memory records; no new async work at boot.
- **Security:** Zero surface change. No new endpoints. XR / MetaHuman / ACE / Live2D adapters are stubs that require future env vars via `AdapterNotConfiguredError`.
- **Database:** No schema, no migration, no RLS change.
- **API:** No public/HTTP route changes. No `createServerFn` additions.

## External SDK Dependencies (activation only)

- MetaHuman: `METAHUMAN_STREAM_URL`, `METAHUMAN_API_KEY`, Unreal Pixel Streaming.
- NVIDIA ACE: `NVIDIA_ACE_URL`, `NVIDIA_ACE_API_KEY`, Audio2Face/Riva.
- Live2D: `LIVE2D_MODEL_URL`, Cubism SDK licence.
- Vision Pro: `APPLE_VISION_PRO_BUNDLE`, visionOS toolchain.
- Windows/macOS/Linux: Tauri codesign material (`WINDOWS_CODESIGN_CERT`, `APPLE_TEAM_ID`, `APPLE_NOTARY_KEY`).
- XR: WebXR-capable device (`WEBXR_DEVICE`).

## Tests

- `tests/unit/happy-r152.test.ts` — verifies the 16-method contract, renderer / platform / XR / asset
  registries, and duplication guards.
