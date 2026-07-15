# LayeredPortrait runtime assets

Optional PSD-style layer stack. Each layer is a transparent PNG that lines
up 1:1 with the base portrait, so the compositor can drive layers
independently from real audio + expression signals.

## Contract (all optional; missing layers just don't render)

| File | Purpose |
|---|---|
| `base.png`       | Full portrait (fallback == portrait/main) |
| `mouth-closed.png` | Mouth closed shape |
| `mouth-a.png`    | Open vowel (AI) |
| `mouth-e.png`    | Wide vowel (E) |
| `mouth-o.png`    | Round vowel (O) |
| `mouth-u.png`    | Narrow round (U) |
| `eyes-open.png`  | Both eyes open |
| `eyes-closed.png`| Both eyes closed |
| `brow-neutral.png`| Neutral brow |
| `brow-raised.png`| Concern / surprise |
| `brow-furrowed.png`| Focus / thinking |
| `smile.png`      | Cheek + jaw lift |

The validator (`asset-contracts.ts`) treats layered assets as an
enhancement — missing files degrade to overlay rendering, they do not
throw.
