# HAPPY Founder AI Operating System (FAIOS) — R66

FAIOS is an **expansion-only** layer that lets the Founder run the entire HAPPY
ecosystem through natural conversation. It reuses existing Supabase auth,
RBAC (`has_role`), RLS, audit (`write_audit`), notifications, and Digital Human.

## Architecture

```text
Founder input (chat/voice)
        │
        ▼
submitFounderCommand  (createServerFn, admin-only)
        │
        ▼
detectIntent()  ── deterministic keyword → plan
        │
        ▼
faios_commands (status: planned | awaiting_approval | blocked)
        │
        ├── faios_activity (planning: succeeded)
        └── faios_terminal_lines (planner: HAPPY understood…)
        │
        ▼
Founder approves ─► approveFounderCommand ─► status=approved
        │
        ▼
executeFounderCommand ─► records execution outcome / blocked reason
        │
        └── activity + terminal + audit trail
```

## Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `faios_commands` | Every founder utterance + generated plan | founder owns row OR admin |
| `faios_memory` | Scoped key/value memory (preferences, decisions, roadmap…) | founder OR admin |
| `faios_workspace_items` | Notes, tasks, ideas, briefs (with pinning) | founder OR admin |
| `faios_terminal_lines` | Streaming planner/executor output | founder OR admin (insert-only) |
| `faios_approvals` | Approval/rejection audit | founder OR admin (insert-only) |
| `faios_activity` | Timeline of pipeline stages | founder OR admin (insert-only) |

All tables have explicit `GRANT`s to `authenticated` + `service_role`; policies
scope by `founder_id = auth.uid()` OR `has_role(auth.uid(), 'admin')`.

## Execution Pipeline

`Understand → Analyze → Locate → Dependency → Risk → Impact → Plan → Preview →
Diff → Typecheck → Tests → Perf → A11y → Security → Approval → Apply → Commit
→ Deploy → Report`

- **Understand / Plan** is deterministic today (`intent-engine.ts`). Adding an
  LLM planner is a drop-in change; API surface unchanged.
- **Preview** (`founder-preview.functions.ts`) returns steps, risk, rollback,
  estimated minutes, and any blocked external dependencies.
- **Approval** requires an explicit Founder decision unless mode = `automatic`
  AND the intent is in the auto-allow-list AND category not in
  `AUTO_MODE_FORBIDDEN` (`database`, `security`, `deployment`).
- **Apply** — this endpoint records intent and gates approval; actual file
  edits are performed by the Lovable agent turn that follows Founder approval
  (this preserves Lovable's single source of truth for code changes).

## Voice

- Browser Speech Recognition API (Chrome/Edge).
- Push-to-talk button, live transcript, submit → `submitFounderCommand`.
- Wake-phrase-ready: the intent engine matches "HAPPY …" prefixed commands.

## Memory Model

- **Scopes** (recommended): `preferences`, `coding_style`, `design_language`,
  `business_rules`, `decisions`, `roadmap`.
- Unique on `(founder_id, scope, key)` — upsert semantics.

## Security

- All server functions require `requireSupabaseAuth` + `has_role admin`.
- Nothing writes outside RLS-guarded tables.
- Every command records to `write_audit` under category `faios`.
- Auto Mode cannot modify auth / payments / credits / wallet / RBAC /
  security / database schema / deployment credentials.

## Known External Dependencies (marked as blocked at plan time)

| Capability | Missing | Required |
|-----------|---------|----------|
| Android APK/AAB | toolchain + keystore | Android SDK, JDK 17, Gradle, `ANDROID_KEYSTORE_*` secrets, Google Play Console |
| iOS IPA | macOS + Xcode | Xcode, `APPSTORE_CONNECT_API_KEY`, Apple Developer Program |
| Desktop package | per-OS toolchains | electron-builder / tauri, signing certs |
| Deploy trigger | publish surface | Lovable Publish flow |

All are surfaced as `plan.blocked = true` with `external_dependencies` populated.

## Performance

- All list endpoints paginate (max 200–500).
- Dashboard uses parallel `Promise.all` reads with narrow columns.
- Client uses TanStack Query with 5–20s intervals depending on view volatility.

## Accessibility

- Semantic headings, keyboard-friendly buttons, focus rings via design tokens.
- Voice UI degrades gracefully when speech API is unavailable.

## Routes

`/founder-ai/dashboard · workspace · chat · voice · memory · terminal · history · tasks · activity · settings`

(Placed under `/founder-ai/*` to avoid touching the pre-existing
`/founder/ai` route, per the expansion-only mandate.)
