# Portrait runtime assets

**Status:** Ready (the shipped `/happy-portrait-v2.png` in `public/` is used).

## Contract

| Slot | Format | Required |
|---|---|---|
| `main`     | PNG or JPG, ≥1024×1280, portrait orientation | yes |
| `alt`      | PNG or JPG, same dimensions                  | no  |

Portraits are static photos. No rigging. No blendshapes. Mouth/eyelid
animation is done via SVG overlays in `HappyAvatar.tsx`.
