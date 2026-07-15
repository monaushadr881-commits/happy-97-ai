# HAPPY Digital Human — Asset Root

Every avatar runtime reads assets from this tree. Do NOT rename folders or
individual filenames without updating `src/components/digital-human/renderers/asset-contracts.ts`.

## Folders

| Folder | Runtime | Status |
|---|---|---|
| `portrait/`   | PortraitRuntime         | Ready (see `portrait/README.md`) |
| `layered/`    | LayeredPortraitRuntime  | Ready (see `layered/README.md`) |
| `live2d/`     | Live2DRuntime           | BLOCKED — asset required |
| `live3d/`     | Live3DRuntime           | BLOCKED — asset required |
| `animations/` | Shared (Live2D + Live3D) | Empty |
| `expressions/`| Shared                  | Empty |
| `voices/`     | TTS voice presets       | Empty |
| `motions/`    | Live2D `.motion3.json`  | Empty |

Never place binary art assets in the git repo directly — upload them via
`lovable-assets` and commit the resulting `.asset.json` pointer next to
where the binary would have lived. See `docs/digital-human-assets.md`.
