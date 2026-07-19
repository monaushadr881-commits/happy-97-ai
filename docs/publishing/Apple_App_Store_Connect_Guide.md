# Apple App Store Connect Guide

## 1. Enroll in Apple Developer Program
- $99 USD / year
- Choose individual or organization (organization requires D-U-N-S number)

## 2. Create App Record
- App Store Connect → **My Apps** → **+** → **New App**
- Platform: iOS
- Bundle ID: `ai.happy.enterprise` (registered in Apple Developer → Identifiers first)
- SKU: `happy-x-ios-001`
- User Access: Full Access

## 3. App Information
- Category: Primary **Productivity**, Secondary **Business** (TODO confirm)
- Content Rights
- Age Rating: complete questionnaire
- Privacy Policy URL: TODO

## 4. Pricing and Availability
- Free (with IAP TODO) or Paid
- Territories: all, or restricted list

## 5. App Privacy
Complete per `Privacy_Checklist.md`. Must match `PrivacyInfo.xcprivacy` in the binary.

## 6. Prepare for Submission (per version)
- Screenshots (see `Assets_Checklist.md`)
- Promotional text (170 chars)
- Description (4000 chars)
- Keywords (100 chars)
- Support URL
- Marketing URL (optional)
- What's New (release notes, per version)
- Build: upload via Xcode Organizer or `xcrun altool` / Transporter

## 7. App Review
- Provide sign-in credentials (test account)
- Contact information
- Notes for reviewer
- Attachments (e.g., demo video for hard-to-test features)

## 8. Version Release
- Manual, Automatic, or Scheduled
- Phased release (7-day auto-rollout) recommended

## Common Rejections
- Guideline 2.1 (crashes) — test on TestFlight first
- Guideline 4.0 (design) — ensure iPad screenshots aren't stretched iPhone
- Guideline 5.1.1 (data collection) — every collected data type must be declared
- Guideline 4.8 (Sign in with Apple) — required if any 3rd-party login is offered
