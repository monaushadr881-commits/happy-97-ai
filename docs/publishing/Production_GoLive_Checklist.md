# Production Go-Live Checklist

The **final gate** before flipping the switch on either store. Governed by R177 → R158.

## T-14 days
- [ ] Feature freeze declared (except critical fixes)
- [ ] Release Candidate cut
- [ ] Legal review of privacy + terms complete
- [ ] Support playbook updated

## T-7 days
- [ ] TestFlight / Internal Testing green with real users
- [ ] Crash-free sessions > 99.5%
- [ ] Performance budgets met (R144)
- [ ] Load test against expected traffic
- [ ] Backups verified (DB + storage)
- [ ] Monitoring dashboards armed (see `Post_Release_Monitoring.md`)

## T-1 day
- [ ] Final Founder approval (R158, tier `critical`) recorded
- [ ] Rollback envelope filled (backup_id, rollback_plan, version, audit_id) — R166
- [ ] Store metadata final review
- [ ] Communication draft ready (email, socials)

## T-0 (Go)
- [ ] Promote build in Play Console → Production
- [ ] Release version in App Store Connect
- [ ] Verify listing live in a few regions
- [ ] Post-release monitoring kicked off

## T+1 hour
- [ ] Live smoke test on real device from each store
- [ ] Confirm sign-in, chat, voice, payment flows

## T+24 hours
- [ ] Review R177 post-release signals (health, performance, errors, stability, adoption)
- [ ] Rollback if `rollbackRecommended` fires
