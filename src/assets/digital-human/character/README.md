# HAPPY Character — Official Identity (R4 Lock)

**Owner:** H.P PRIVATE LIMITED · **Status:** Locked (Founder-approved).

This directory is the permanent character manifest for HAPPY. Nothing here
may be changed without Founder approval per `docs/MASTER_CONSTITUTION.md`.

## Files

| File | Purpose |
|---|---|
| `character.json` | Root manifest (references every sub-file) |
| `identity.json` | Official name, role, owner, greeting, prohibited variants |
| `appearance.json` | Visual specification (face, hair, outfit, palette, environment) |
| `expressions.json` | 17-token expression library + blend policy |
| `animations.json` | Idle loops, gestures, reduced-motion policy |
| `runtime.json` | Active runtime (portrait) + BLOCKED runtimes (Live2D/Live3D) |
| `voice.json` | TTS profile, languages, streaming, audio bus |
| `personality.json` | Core traits, role tones, guardrails |
| `happy-reference-r4.png.asset.json` | CDN pointer to the official reference image |

## Do NOT

- Do NOT redesign face, hair, or body proportions.
- Do NOT change outfit unless the Founder approves.
- Do NOT swap for a generic avatar, ReadyPlayerMe, stock character, cartoon, or anime.
- Do NOT enable Live2D or Live3D runtimes until the required assets exist
  (see `runtime.json` → `runtimes.live2d` / `runtimes.live3d`).

## Integration

Every HAPPY surface (Founder, Business OS, Revenue, Marketplace, Builder,
Cloud, Notifications, Presentation, Whiteboard, Digital Library, AAS PAAS,
H.P SHUDDH MASALE, Razvi Academy) MUST use this character. There is one
HAPPY, one Brain, one Memory, one Operating System.
