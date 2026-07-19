# Post-Release Monitoring

Signals watched by R177 Release Director for the first 7 days of every release.

## Signals (source: `POST_RELEASE_SIGNALS` in `src/lib/founder/ai-release-director.ts`)

| Signal | Healthy | Warn | Rollback |
|---|---|---|---|
| `health` (composite) | ≥ 90 | 70–89 | < 60 |
| `performance` (p95) | ≥ 85 | 60–84 | < 50 |
| `errors` (per 1k sessions) | 0–2 | 3–10 | > 20 |
| `stability` (crash-free %) | ≥ 99.5 | 98–99.5 | < 97 |
| `adoption` (7d active install %) | ≥ 60 | 30–59 | — |
| `rollbackRequests` (users) | 0 | 1–4 | ≥ 5 |

## Dashboards (existing routes)
- `/founder/analytics` — usage & adoption
- `/founder/ops` — health, alerts, incidents
- `/founder/security` — Guardian AI signals
- `/releases/analytics` — release-scoped view
- `/releases/logs` — rollout logs
- `/founder/publishing` — publishing status

## External Signal Sources (BLOCKED / optional)
- Google Play Console → Vitals
- Apple App Store Connect → Analytics / Crashes
- Firebase Crashlytics (if wired)

## Cadence
- First hour: continuous
- First 24h: hourly review
- First 7 days: daily summary posted to Founder Brief (`/founder/brief`)
