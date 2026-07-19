# Versioning Guide

Owned by **R177 AI Release Director™** (`src/lib/founder/ai-release-director.ts`). All version choices route through R158.

## SemVer
`MAJOR.MINOR.PATCH[-prerelease]`

- **MAJOR** — breaking API / data changes; requires migration plan + council review
- **MINOR** — new capabilities, backward-compatible
- **PATCH** — bug fixes only
- **hotfix** — expedited patch (canary rollout preferred)

## Store-Specific Fields

### Android
| Field | Rule |
|---|---|
| `versionName` | Mirrors SemVer, e.g. `1.4.0` |
| `versionCode` | Monotonic integer. Suggested: `MAJOR*10000 + MINOR*100 + PATCH` |

### iOS
| Field | Rule |
|---|---|
| `CFBundleShortVersionString` | Mirrors SemVer, e.g. `1.4.0` |
| `CFBundleVersion` (build) | Monotonic integer per `CFBundleShortVersionString` |

## Web / PWA
- `package.json` version (currently unset — TODO initialize at `0.1.0`)
- SSR build embeds commit SHA for support triage

## Cadence Guidance
- Patch: as needed
- Minor: 2–4 weeks
- Major: quarterly (only with Founder + Council alignment per R179)

## Never
- Reuse a `versionCode` / build number
- Skip an approval gate for "just a small fix"
- Publish without release notes
