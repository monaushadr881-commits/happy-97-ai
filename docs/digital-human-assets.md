# HAPPY Digital Human — Asset Pipeline

**Status:** Asset Pipeline Ready. Portrait + Layered runtimes validated.
Live2D and Live3D remain `BLOCKED_ASSET_REQUIRED` until the files listed
below ship.

## Folder structure

```
src/assets/digital-human/
├── portrait/          # PortraitRuntime — ready (uses /public/happy-portrait-v2.png)
├── layered/           # LayeredPortraitRuntime — optional PSD-style overlays
├── live2d/            # Live2DRuntime — BLOCKED
│   ├── textures/
│   ├── expressions/
│   └── motions/
├── live3d/            # Live3DRuntime — BLOCKED
│   ├── animations/
│   ├── blendshapes/
│   ├── materials/
│   ├── textures/
│   └── environment/
├── animations/        # Shared clip manifest (runtime-agnostic)
├── expressions/       # Shared expression → weight tables
├── voices/            # TTS voice preset overrides
└── motions/           # Live2D `.motion3.json` clips
```

Each folder has a `README.md` describing its exact contract.

## Naming rules

- **Cubism model:** always `model.model3.json` + `model.moc3` at the
  `live2d/` root.
- **GLB avatar:** always `avatar.glb` at the `live3d/` root.
- **Textures:** kebab-case, PNG for Live2D, KTX2/Basis preferred for Live3D.
- **Motion clips:** kebab-case verbs — `idle`, `greeting`, `talking`,
  `thinking`.
- **Expression presets:** match `AvatarExpression` tokens exactly —
  `neutral`, `smile`, `thinking`, `explain`, `concern`, `celebrate`,
  `listen`, `confidence`, `empathy`, `teaching`, `business`, `founder`.

## Supported formats

| Asset kind | Formats |
|---|---|
| Portrait / layered PNG | PNG, JPG |
| Live2D model | `.moc3` + `.model3.json` |
| Live2D textures | PNG (2K max) |
| Live2D motions | `.motion3.json` |
| Live2D expressions | `.exp3.json` |
| Live2D physics | `.physics3.json` |
| Live3D mesh | `.glb` (glTF 2.0 binary) |
| Live3D animations | `.glb` clip files |
| Live3D lighting | `.hdr` (equirectangular IBL) |

## Texture limits

- Live2D: 2048×2048 max per texture, 8 textures max, PNG only.
- Live3D: 2048×2048 max per texture, KTX2/Basis compressed preferred,
  external textures allowed but embedded is preferred.

## Polygon limits

- Live2D: no polygon limit (2D mesh), but keep drawable count ≤50 for
  mobile.
- Live3D head mesh: ≤50k triangles.
- Live3D body mesh: ≤80k triangles.
- Total download budget for the base Live3D avatar bundle: ≤25 MB.

## Animation requirements

- Idle loop: 6–10s, seamless loop, chest-rise + shoulder-drift only.
- Greeting: 1.5–2.5s, one-shot, ends in idle pose.
- Talking: 2–4s, seamless loop, additive over idle.
- Thinking: 3–5s, seamless loop, subtle head tilt + brow furrow.

All Live3D clips MUST be authored on the same skeleton as `avatar.glb`.

## Blendshape requirements

**Live2D** — required Cubism parameter IDs:
`ParamMouthOpenY`, `ParamMouthForm`, `ParamEyeLOpen`, `ParamEyeROpen`,
`ParamEyeBallX`, `ParamEyeBallY`, `ParamAngleX`, `ParamAngleY`,
`ParamAngleZ`, `ParamBodyAngleX`, `ParamBreath`.

**Live3D** — full ARKit 52 blendshape set (see
`src/assets/digital-human/live3d/README.md` for the complete list).
Missing shapes cause the loader to fall back to the next-best runtime.

## Uploading assets

All binaries MUST be uploaded via `lovable-assets create --file <path>`
and referenced through the resulting `.asset.json` pointer. Do NOT
commit `.moc3`, `.glb`, `.hdr`, or large PNG files directly to git —
they belong on the CDN.

## Runtime detection

`src/components/digital-human/renderers/runtime-detect.ts` builds a
manifest from a Vite `import.meta.glob("/src/assets/digital-human/**/*")`
at build time and calls `validateAll(manifest)` from
`asset-contracts.ts`. The chosen runtime is the first in this order
whose required assets are all present:

1. `live3d`
2. `live2d`
3. `layered-portrait`
4. `portrait` (always available)

If a runtime is missing required assets, `validateRuntime` returns
`{ status: "blocked_asset_required", missing: [...] }`. Nothing throws.
Nothing silently fails.

## Missing asset checklist (as of R3-DH)

**Live2D — BLOCKED**
- `src/assets/digital-human/live2d/model.model3.json`
- `src/assets/digital-human/live2d/model.moc3`
- `src/assets/digital-human/live2d/textures/texture_00.png`
- `src/assets/digital-human/live2d/physics3.json`

**Live3D — BLOCKED**
- `src/assets/digital-human/live3d/avatar.glb`

**Layered portrait — degraded (base only)**
- `src/assets/digital-human/layered/base.png` (optional; falls back to portrait)

Portrait runtime is fully ready — no missing assets.
