# Google Play Console Guide

Step-by-step Play Console flow. Every step below is performed by the Founder or DevOps in the external Play Console — **not** by AI, and not by repository code.

## 1. Create the App
- Console → **Create app**
- Default language: English (US)
- App type: **App**
- Free / Paid: Free (with in-app purchases — TODO confirm)
- Declarations: developer program policies, US export laws — check

## 2. Set Up Your App (left rail checklist)
- App access (login credentials for review) — provide a review-only test account
- Ads: **No** (unless changed) — confirm
- Content rating: complete IARC questionnaire
- Target audience: age groups
- News app: **No**
- COVID-19 tracing: **No**
- Data safety: complete per `Privacy_Checklist.md`
- Government app: **No**
- Financial features: TODO (payments module)

## 3. Store Listing
Fields from `Store_Metadata.md` and `Store_Descriptions.md`.

## 4. Store Assets
See `Assets_Checklist.md`.
- Icon 512×512 PNG (32-bit alpha)
- Feature graphic 1024×500
- Phone screenshots (2–8), 16:9 or 9:16
- 7" and 10" tablet screenshots
- Promo video URL (YouTube) — optional

## 5. App Signing
- Enroll in **Play App Signing** (Google manages the upload key)
- Upload keystore or generate new via Play Console

## 6. Release
- Create **Internal testing** track first
- Upload AAB
- Add testers
- Promote → Closed → Open → Production

## 7. Review
- Typical review: 1–7 days
- Common rejections: undeclared permissions, missing privacy policy, data safety mismatch
