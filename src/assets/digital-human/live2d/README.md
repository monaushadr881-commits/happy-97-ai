# Live2D runtime assets — BLOCKED

Requires a **Live2D Cubism SDK licence** (proprietary, per-seat).

## Required files (exact names)

| File | Purpose |
|---|---|
| `model.model3.json`  | Cubism model manifest |
| `model.moc3`         | Compiled mesh + rig |
| `textures/texture_00.png` (+ additional textures) | Diffuse textures |
| `physics3.json`      | Hair / cloth / breast physics |
| `pose3.json`         | Layer visibility groups (optional but recommended) |
| `expressions/*.exp3.json` | Expression presets |
| `motions/idle.motion3.json`     | Idle body sway |
| `motions/greeting.motion3.json` | Wave / greet |
| `motions/talking.motion3.json`  | Speaking body language |

## Blendshape / parameter contract

The rig MUST expose these Cubism parameter IDs (case-sensitive):

- `ParamMouthOpenY` — driven by TTS RMS (0..1)
- `ParamMouthForm`  — driven by spectral centroid (-1..+1)
- `ParamEyeLOpen`, `ParamEyeROpen` — driven by blink scheduler (0..1)
- `ParamEyeBallX`, `ParamEyeBallY` — driven by gaze target (-1..+1)
- `ParamAngleX`, `ParamAngleY`, `ParamAngleZ` — driven by head drift
- `ParamBodyAngleX` — driven by weight-shift
- `ParamBreath` — driven by breathing cycle (0..1)

If any parameter is missing the runtime falls back to the overlay-based
portrait renderer and emits a warning to the console.
