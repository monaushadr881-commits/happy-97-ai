# Release Checklist (Every Release)

Pre-flight for any store submission. Governed by R177 Release Director → R158 Approval Gateway.

## Code
- [ ] `bun run build` clean
- [ ] All unit tests green
- [ ] `tsgo` clean (no type errors)
- [ ] Lighthouse / bundle budget within R144 limits
- [ ] Feature flags default to safe values

## Version
- [ ] `versionName` bumped per SemVer (see `Versioning_Guide.md`)
- [ ] Android `versionCode` incremented
- [ ] iOS build number incremented
- [ ] `CHANGELOG` / release notes drafted (`Release_Notes_Template.md`)

## Assets
- [ ] Store icons unchanged unless intentional
- [ ] Screenshots reflect current UI (no stale screens)

## Legal / Privacy
- [ ] Privacy policy URL live
- [ ] Data safety / App Privacy matches actual behavior
- [ ] New permissions justified (`Permissions_Audit.md`)

## Governance
- [ ] R158 approval recorded (audit id)
- [ ] Rollback plan filled (`Rollback_Checklist.md`)
- [ ] R166 rollback envelope present

## Store
- [ ] Google: AAB uploaded to internal track first
- [ ] Apple: build uploaded to TestFlight first
- [ ] At least one device smoke test on latest OS

## Sign-off
- [ ] Founder approval (R156 identity verified)
- [ ] Release Director recommendation captured
