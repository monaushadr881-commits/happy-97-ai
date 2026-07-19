# Android Publishing Guide

## App Identity (already configured)

- **Application ID / package**: `ai.happy.enterprise` (source: `capacitor.config.ts`)
- **App Name**: `HAPPY X`
- **Splash background**: `#0B0B0D`
- **Status bar**: dark, `#0B0B0D`

## Version Fields

Managed via Capacitor / Gradle when the native project is initialized.

- `versionCode` (integer, monotonically increasing) — TODO (start at `1`)
- `versionName` (semver display) — TODO (mirror `package.json` when set)
- `minSdkVersion` — recommended `24` (Android 7.0)
- `targetSdkVersion` — Play requirement: **latest (34+)** as of submission window
- `compileSdkVersion` — match target

## Initialize Native Project (external step, NOT run in Lovable sandbox)

```bash
bun run build
npx cap add android
npx cap sync android
npx cap open android   # requires Android Studio
```

## Permissions to Justify in Play Console

| Permission | Feature | Justification |
|---|---|---|
| `INTERNET` | Core | API + AI Gateway calls |
| `POST_NOTIFICATIONS` (33+) | HAPPY delivery bus | Personal delivery notifications (payments, deployments) |
| `RECORD_AUDIO` | Voice chat (R95) | STT for HAPPY conversation |
| `CAMERA` | Optional profile / file capture | Only requested on user tap |
| `READ_MEDIA_IMAGES` | File engine (R119) | User uploads |

Do **not** request permissions the app doesn't actually use.

## Deep Links / App Links

- Web scheme: `https` (see `capacitor.config.ts` → `server.androidScheme`)
- Universal links host: TODO (production domain)
- `assetlinks.json` hosting: TODO — publish at `https://<domain>/.well-known/assetlinks.json`

## Build Artifacts

- Release format: **AAB** (`.aab`)
- Signing: v2/v3 with Play App Signing enrolled
- ProGuard/R8: enabled (Capacitor default)

## Play Integrity API

Recommended for anti-abuse. Requires Play Console setup + API key. TODO.

## Referenced Adapters

- `src/lib/happy-adapters/mobile/android.ts` — reports readiness only; never fabricates builds.
