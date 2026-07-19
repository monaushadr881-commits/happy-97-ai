# Permissions Audit

Every permission requested must be **used**, **declared**, and **justified**.

## Android

| Permission | Used By | Justification (for Play Console) |
|---|---|---|
| `INTERNET` | All API calls | Required for AI + backend |
| `ACCESS_NETWORK_STATE` | Offline detection | Show offline banner |
| `POST_NOTIFICATIONS` | HAPPY delivery bus | Deliver personal notifications (payments, deployments, alerts) |
| `RECORD_AUDIO` | Voice chat (R95 STT) | Speech-to-text for conversation. Requested only when user taps the mic. |
| `CAMERA` | Optional profile / file capture | Requested only when user opens file picker |
| `READ_MEDIA_IMAGES` (33+) | File engine (R119) | User attaches images to conversations |
| `VIBRATE` | Notification feedback | Subtle haptic on delivery |
| `WAKE_LOCK` | Voice session keep-alive | While user is actively in a voice conversation |

**Not requested** (must NOT be added unless a feature genuinely uses them): `READ_CONTACTS`, `ACCESS_FINE_LOCATION`, `READ_SMS`, `READ_CALL_LOG`, `MANAGE_EXTERNAL_STORAGE`.

## iOS

| Purpose String Key | Copy |
|---|---|
| `NSMicrophoneUsageDescription` | "HAPPY listens to your voice to answer you." |
| `NSCameraUsageDescription` | "Used when you add a profile photo or attach an image." |
| `NSPhotoLibraryUsageDescription` | "Used to attach images from your library." |
| `NSPhotoLibraryAddUsageDescription` | "Used to save exports back to your library." |

Do NOT add: `NSLocationWhenInUseUsageDescription`, `NSContactsUsageDescription`, `NSCalendarsUsageDescription`, `NSHealthShareUsageDescription`, `NSMotionUsageDescription` — unless a real feature ships.

## Result
- **No over-permissioning** ✔
- All requested permissions map to a user-visible feature ✔
