# Publishing Blockers (External Dependencies)

All items below are **BLOCKED by external systems**, not by repository code.
Nothing here should be "fixed by writing code" — each requires an account, credential, or native build host.

## Google Play (Android)

| # | Blocker | Required | Owner |
|---|---|---|---|
| A1 | Google Play Developer Account | $25 one-time; identity verification | Founder |
| A2 | Android Studio / Gradle build host | Local machine or CI | DevOps |
| A3 | Release keystore (JKS) | `keytool` generated; stored securely | DevOps |
| A4 | Signing envs: `ANDROID_KEYSTORE_PATH`, `_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` | Secrets manager | DevOps |
| A5 | Play Console service account JSON | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Founder |
| A6 | `google-services.json` (if Firebase used) | Firebase console | DevOps |
| A7 | Adaptive icon, feature graphic, screenshots (see `Assets_Checklist.md`) | Design | Design |
| A8 | Data Safety form values | Legal review | Legal + Founder |
| A9 | Content rating questionnaire | IARC | Founder |

## Apple App Store (iOS)

| # | Blocker | Required | Owner |
|---|---|---|---|
| I1 | Apple Developer Program | $99/yr | Founder |
| I2 | macOS host with Xcode | `XCODE_PATH`, `APPLE_TEAM_ID` | DevOps |
| I3 | Distribution certificate (`.p12`) + password | Apple Developer portal | DevOps |
| I4 | Provisioning profile (App Store) | Apple Developer portal | DevOps |
| I5 | App Store Connect API key | `APPSTORE_CONNECT_KEY_ID`, `_ISSUER_ID`, `_PRIVATE_KEY` | Founder |
| I6 | Push Notification key (APNs) | Apple Developer portal | DevOps |
| I7 | Privacy Manifest (`PrivacyInfo.xcprivacy`) | Filled per Apple spec | Legal |
| I8 | App Privacy answers in App Store Connect | Legal review | Legal |
| I9 | Screenshots for 6.7", 6.5", 5.5", iPad 12.9" | Design | Design |

## Shared

| # | Blocker | Notes |
|---|---|---|
| S1 | Support email + support URL | e.g. support@happy.ai + `/support` |
| S2 | Privacy Policy URL (public) | Draft in repo; must be hosted publicly |
| S3 | Terms of Service URL | Same |
| S4 | EULA (Apple standard OK) | Optional custom |
| S5 | Marketing URL | Landing page |
| S6 | Legal entity name for store listing | "HAPPY PERSON PRIVATE LIMITED" (confirm) |

**None of these can be resolved inside this repository.** They require Founder action in external portals and DevOps action on a native build host.
