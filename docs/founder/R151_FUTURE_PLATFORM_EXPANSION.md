# R151 — Future Platform Expansion (Founder Decision)

**Status:** PENDING — architecture only. Do not implement. Do not create duplicate runtimes.
**Locks:** R91 Vision Lock · R111 Architecture Lock · R113 Founder Constitution.
**Permanence:** These items are permanent Founder Vision entries and must never be removed.

## Category

Future Platform Expansion

## Scope

### Platforms (PENDING)
- Windows
- macOS
- Linux
- Apple Vision Pro

### Digital Human Engines (PENDING)
- VRM (Primary — already canonical; other engines plug into the same runtime)
- MetaHuman Renderer
- Live2D Renderer
- NVIDIA ACE Renderer

### XR Modes (PENDING)
- AR
- VR
- Mixed Reality

## Non-Negotiable Reuse Rules

Every item above MUST plug into the existing canonical owners. No new runtime, no second brain, no second memory, no second workspace, no second digital human, no second conversation engine.

- **Digital Human runtime:** `src/components/digital-human/HappyVRM.tsx` + `src/lib/happy-runtime/digital-human.ts` (adapter contract in `src/lib/happy-adapters/digital-human/`).
- **Brain:** `src/brain/kernel.ts` (13-stage `runBrain`).
- **Memory:** canonical Memory Intelligence owner.
- **Workspace:** `src/workspace/`.
- **Conversation:** canonical conversation engine.

New renderers (MetaHuman / Live2D / NVIDIA ACE) MUST be implemented as adapters conforming to `DigitalHumanAdapter` / `DigitalHumanRuntime` and driven by the same audio/viseme/gesture bus. New platforms (Windows / macOS / Linux / Vision Pro) MUST reuse the existing web build via the universal runtime shell strategy (see `docs/architecture/universal-runtime.md`) — no forked codebase.

## Architecture (Diagram)

```text
Brain
  │
Memory
  │
Workspace
  │
Conversation
  │
Digital Human  (single runtime, single mount: HappyDesk → HappyVRM)
  │
  ├── VRM             (Primary — active)
  ├── MetaHuman       (PENDING adapter)
  ├── Live2D          (PENDING adapter)
  ├── NVIDIA ACE      (PENDING adapter)
  └── Future Renderers (adapter contract only)
```

## Activation Gate

Each PENDING item is unblocked only when:
1. External dependency is available (SDK licence, rigged asset bundle, native shell credentials, XR device runtime).
2. Adapter lands under the existing canonical owner directory — never a parallel runtime.
3. Founder ratifies the activation in `docs/founder/FOUNDER_DECISIONS.md`.

## Permanence

These entries are appended to the Founder Master Scope and Founder Registry and are permanent Vision items under R91. They cannot be removed, downgraded, or replaced — only extended.
