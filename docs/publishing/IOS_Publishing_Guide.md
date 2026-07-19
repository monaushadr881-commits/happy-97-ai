# iOS Publishing Guide

## App Identity

- **Bundle Identifier**: `ai.happy.enterprise` (source: `capacitor.config.ts` → `appId`)
- **Display Name**: `HAPPY X`
- **iOS scheme**: `https`

## Initialize Native Project (external step, NOT run in Lovable sandbox)

```bash
bun run build
npx cap add ios
npx cap sync ios
npx cap open ios       # requires Xcode on macOS
```

## Info.plist Keys (required)

| Key | Value / Purpose |
|---|---|
| `NSMicrophoneUsageDescription` | "HAPPY listens to your voice to answer you." |
| `NSCameraUsageDescription` | "Used when you add a profile photo or attach an image." |
| `NSPhotoLibraryUsageDescription` | "Used to attach images from your library." |
| `NSUserTrackingUsageDescription` | Only if IDFA used — TODO decide |
| `ITSAppUsesNonExemptEncryption` | `false` (standard HTTPS only) |
| `UIBackgroundModes` | `remote-notification`, `audio` (if voice continues in background) |

## Privacy Manifest (`PrivacyInfo.xcprivacy`)

Required by Apple since 2024. Must declare:
- Data types collected (email, user ID, usage data)
- Required Reason APIs used (UserDefaults, FileTimestamp, etc.)
- Tracking domains (none)

TODO: generate `PrivacyInfo.xcprivacy` when native project is initialized.

## Capabilities / Entitlements

- Push Notifications (APNs)
- Sign in with Apple (required if any social login offered — currently Google via Supabase → **Sign in with Apple mandatory**)
- Associated Domains (`applinks:<domain>`)
- Keychain sharing (if session persisted)

## Universal Links

- Host: TODO
- `apple-app-site-association` at `https://<domain>/.well-known/apple-app-site-association`

## Signing

- Distribution certificate `.p12` — TODO
- App Store provisioning profile — TODO
- Team ID `APPLE_TEAM_ID` — TODO

See `src/lib/happy-adapters/mobile/ios.ts` for readiness enforcement.

## Build

- Format: `.ipa` via Xcode Organizer or `xcodebuild -exportArchive`
- Upload via Transporter or App Store Connect API (`APPSTORE_CONNECT_*` envs)
