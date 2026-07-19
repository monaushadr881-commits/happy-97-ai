# Certificates & Signing Checklist

Handled by DevOps on a secure build host. Never commit any of these files.

## Android

| Item | Env / Location | Status |
|---|---|---|
| Upload keystore (`.jks`) | secure vault | TODO |
| `ANDROID_KEYSTORE_PATH` | secret | TODO |
| `ANDROID_KEYSTORE_PASSWORD` | secret | TODO |
| `ANDROID_KEY_ALIAS` | secret | TODO |
| `ANDROID_KEY_PASSWORD` | secret | TODO |
| Play App Signing enrolled | Play Console | TODO |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | secret | TODO |
| `ANDROID_PACKAGE_NAME` = `ai.happy.enterprise` | build env | TODO |

Readiness enforcement: `src/lib/happy-adapters/mobile/android.ts::readiness()`.

## iOS

| Item | Env / Location | Status |
|---|---|---|
| Apple `TEAM_ID` | `APPLE_TEAM_ID` | TODO |
| Distribution `.p12` cert | secure vault | TODO |
| `APPLE_SIGNING_CERT_P12` | secret | TODO |
| `APPLE_SIGNING_CERT_PASSWORD` | secret | TODO |
| App Store provisioning profile | Apple Developer portal | TODO |
| `APPLE_PROVISIONING_PROFILE` | secret | TODO |
| APNs key `.p8` | secure vault | TODO |
| App Store Connect API key | `APPSTORE_CONNECT_KEY_ID`, `_ISSUER_ID`, `_PRIVATE_KEY` | TODO |
| Xcode path on build host | `XCODE_PATH` | TODO |

Readiness enforcement: `src/lib/happy-adapters/mobile/ios.ts::readiness()`.

## Rotation Policy
- Rotate Play service account annually
- Rotate App Store Connect API key annually
- Rotate APNs key on team change
- **Never** rotate the Android upload key without Play Console key upgrade flow (breaks updates)
