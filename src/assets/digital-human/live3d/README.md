# Live3D runtime assets — BLOCKED

Requires a **rigged glTF/GLB avatar** with the ARKit 52 blendshape set.

## Required files (exact names)

| File | Purpose |
|---|---|
| `avatar.glb`                 | Rigged mesh + humanoid skeleton + 52 ARKit blendshapes |
| `animations/idle.glb`        | Idle loop (breathing + weight shift) |
| `animations/greeting.glb`    | Wave / greet |
| `animations/talking.glb`     | Additive speaking body language |
| `animations/thinking.glb`    | Reflective pose |
| `blendshapes/README.md`      | Human-readable list of the 52 ARKit shapes |
| `materials/*.json`           | PBR material overrides (optional) |
| `textures/*.png`             | External textures (optional; prefer embedded) |
| `environment/studio.hdr`     | IBL environment map (studio lighting) |
| `environment/boardroom.hdr`  | IBL environment map (boardroom lighting) |

## Blendshape contract (ARKit 52)

The head mesh MUST expose the standard ARKit blendshape names —
`jawOpen`, `mouthClose`, `mouthFunnel`, `mouthPucker`, `mouthLeft`,
`mouthRight`, `mouthSmileLeft`, `mouthSmileRight`, `mouthFrownLeft`,
`mouthFrownRight`, `eyeBlinkLeft`, `eyeBlinkRight`, `eyeLookInLeft`,
`eyeLookOutLeft`, `eyeLookUpLeft`, `eyeLookDownLeft`, `eyeLookInRight`,
`eyeLookOutRight`, `eyeLookUpRight`, `eyeLookDownRight`,
`browDownLeft`, `browDownRight`, `browInnerUp`, `browOuterUpLeft`,
`browOuterUpRight`, `cheekPuff`, `cheekSquintLeft`, `cheekSquintRight`,
`noseSneerLeft`, `noseSneerRight`, `tongueOut`, `eyeSquintLeft`,
`eyeSquintRight`, `eyeWideLeft`, `eyeWideRight`, `jawForward`,
`jawLeft`, `jawRight`, `mouthDimpleLeft`, `mouthDimpleRight`,
`mouthLowerDownLeft`, `mouthLowerDownRight`, `mouthPressLeft`,
`mouthPressRight`, `mouthRollLower`, `mouthRollUpper`, `mouthShrugLower`,
`mouthShrugUpper`, `mouthStretchLeft`, `mouthStretchRight`,
`mouthUpperUpLeft`, `mouthUpperUpRight`.

The runtime maps live TTS phonemes → these blendshape weights via a
viseme table. Missing blendshapes cause the loader to fall back to
Live2D → LayeredPortrait → Portrait.

## Polygon / texture limits

- Head mesh: ≤50k triangles.
- Body mesh: ≤80k triangles.
- Textures: 2048×2048 max, KTX2/Basis compressed preferred.
- Total download budget: ≤25 MB for the base avatar bundle.
