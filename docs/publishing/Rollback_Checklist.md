# Rollback Checklist

Owned by **R166 Rollback & Recovery** with mandatory **R158** approval.

## Prepare (Before Release)
- [ ] Backup id captured (DB + storage snapshot)
- [ ] Previous store artifact preserved (AAB / IPA + build number)
- [ ] Feature flags default-off toggle available
- [ ] Rollback plan text written and stored with the release record

## Rollback Triggers (any one is sufficient)
- Crash-free sessions < 98% within 1 hour
- p95 latency regression > 30%
- Payment failure rate > 2%
- Auth failure rate > 5%
- Data-integrity alarm from Guardian AI (R160)
- Rollback requests from users > 5 in first hour

## Execute
- [ ] Founder R158 approval recorded (tier `critical`)
- [ ] Google Play: halt rollout → publish previous AAB as new build (build number must be greater)
- [ ] Apple: use "Remove from Sale" or push previous build via phased release
- [ ] Server: restore feature flags, revert migrations if applicable (backup id)
- [ ] Notify users in-app if data was affected

## Verify
- [ ] Metrics return to baseline
- [ ] No orphaned records in database
- [ ] Support tickets triaged
- [ ] Post-mortem scheduled within 48 hours (R160 + R166 report)
