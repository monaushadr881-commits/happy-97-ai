# R127 — HAPPY Communication Hub Intelligence™

**Status:** Shipped (extension only; zero duplicate runtime).
**Locks:** R91 Vision · R111 Architecture · R113 Founder Constitution.

## Canonical Owners (extended, never replaced)

| Concern              | Canonical Owner |
|----------------------|-----------------|
| Notifications        | `src/services/domain/notification.service.ts` + `src/lib/notification-center.functions.ts` |
| Templates            | `src/lib/template-v1.functions.ts` |
| Automation runtime   | `src/lib/automation-runtime-v3.functions.ts` |
| Communication APIs   | `src/lib/communications-v16.functions.ts` |
| Brain / Memory / Workspace / Search / Files / DH | R115–R120 |

R127 adds one file — `src/lib/happy-r127/communication-intelligence.ts` — plus tests
and this doc. No new tables, APIs, routes, or runtimes.

## Gap Report → Fixes

| Gap                                                | Resolution |
|----------------------------------------------------|------------|
| Kind/priority classification scattered per caller  | `classifyKind`, `classifyPriority` |
| Channel routing hard-coded per site                | `pickChannels` honouring prefs + priority escalation |
| Template rendering re-implemented per feature      | `renderTemplate` + `extractTemplateVars` + `validateTemplate` |
| No throttle / dedupe / batching                    | `shouldThrottle`, `dedupeMessages`, `batchDigest` |
| No quiet-hours defer                               | `inQuietHours` + `deferForQuietHours` (bypass for critical/urgent) |
| Automation runtime lacked safe rule eval           | `evaluateRules` with per-rule sandboxing |
| Analytics ad-hoc                                   | `deliveryRate`/`openRate`/`clickThroughRate`/`bounceRate`/`channelHealth` |
| Brain had no comm resolver                         | `classifyCommIntent` + `resolveForBrain` |
| DH had no comm preset                              | `pickDhCommMode` (assistant/presenter/concierge/alert/silent) |
| Roles ungoverned                                   | 6×9 `commCan(role, cap)` matrix |

## Transports (architecture-ready)

7 channels modelled — `in_app`, `email`, `sms`, `push`, `webhook`, `voice`, `whatsapp`.
Provider credentials remain **BLOCKED-EXTERNAL** and activate through the
existing notification runtime the moment secrets are supplied.

## Impact

- **Database:** none.
- **APIs:** none (extension helpers only).
- **Security:** rule evaluator sandboxes exceptions; quiet-hours never suppresses
  critical/urgent so security/billing always land.
- **Performance:** pure functions, O(n) worst case.
- **Backward compatibility:** 100%.

## Tests

`tests/unit/happy-r127.test.ts` — classification, routing, templating, throttle,
dedupe, digests, quiet-hours, automation rules, analytics, brain resolver,
DH modes, permissions, snapshot.
