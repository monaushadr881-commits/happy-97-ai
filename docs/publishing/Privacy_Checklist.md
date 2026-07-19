# Privacy Checklist

Fill this out identically for **Google Play Data Safety** and **Apple App Privacy**. Any mismatch is a common rejection cause.

## Data Collected

| Data Type | Collected? | Linked to user? | Used for tracking? | Purpose |
|---|---|---|---|---|
| Email address | Yes | Yes | No | Account, auth |
| Name | Yes (optional) | Yes | No | Personalization |
| User ID | Yes | Yes | No | Account |
| Device ID | No | – | – | – |
| Voice recordings | Ephemeral (STT only) | No | No | Speech-to-text; not stored |
| Photos / media | Only when user uploads | Yes | No | User content |
| Files / documents | Only when user uploads | Yes | No | User content |
| Chat / conversation history | Yes | Yes | No | Memory + continuity |
| Usage data (in-app events) | TODO decide (currently none shipped) | – | – | – |
| Crash data | TODO (Crashlytics not wired yet) | No | No | Diagnostics |
| Location | **No** | – | – | – |
| Contacts | **No** | – | – | – |
| Financial info | Only if IAP purchased (handled by store) | No | No | Purchases |

## Data Sharing
- **We do not sell user data.**
- Third parties who process data on our behalf: Lovable Cloud (hosting/DB), Lovable AI Gateway (model inference).

## Security Practices
- Data encrypted in transit (HTTPS)
- Data encrypted at rest (managed DB)
- **User can request deletion** — TODO ship account-deletion endpoint
- **User can request export** — TODO ship data-export endpoint
- Reviewed against **Play Families Policy**: N/A (not directed at children)

## Privacy Policy
- URL: **TODO** — must be publicly hosted before submission
- Must match every entry above exactly

## iOS PrivacyInfo.xcprivacy — Required Reason APIs
Declare only APIs actually used:
- `NSPrivacyAccessedAPICategoryUserDefaults` — reason `CA92.1` (app-internal state)
- `NSPrivacyAccessedAPICategoryFileTimestamp` — reason `C617.1` (display file info to user)

Do not declare APIs not used.
