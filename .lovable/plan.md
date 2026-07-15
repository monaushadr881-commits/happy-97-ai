## R61 — Universal Deployment Runtime (honest scope)

You've asked for two things in one turn:
1. A backend runtime that tracks platforms, builds, artifacts, signing, store readiness.
2. Actual multi-platform binaries (APK, AAB, IPA, Windows/macOS/Linux installers) + happy.ai deployment.

I can deliver (1) end-to-end in this pass. I cannot honestly deliver (2) from this sandbox — and per your own "never fake" rules, I will not pretend otherwise. This plan makes that split explicit.

---

### What I will build this pass (WORKING)

**A. Universal Deployment Runtime — database (single migration)**

Four RLS-secured tables, all immutable-audit where appropriate, `service_role` + `authenticated` GRANTs, `has_role('admin')` gating:

- `deploy_platform_registry` — canonical list of 13 platforms (web, pwa, android_apk, android_aab, ios, ipados, macos, windows, linux, chromeos, android_tv, wearos, visionpro) with adapter, target_channel, required_dependencies (jsonb), enabled flag, readiness state.
- `deploy_builds` — one row per build attempt: platform, channel (prod/staging/test/dev), version, git_sha, status (queued/running/succeeded/failed/blocked), started_at, finished_at, blocked_reason, logs_url.
- `deploy_artifacts` — one row per produced artifact: build_id, kind (web_bundle/pwa/apk/aab/ipa/msi/dmg/appimage/deb), size_bytes, sha256, storage_url, signed (bool), signing_identity, metadata.
- `deploy_store_readiness` — per-store gating: store (google_play/app_store/microsoft_store/web), status (ready/blocked/submitted/live), missing_dependencies (jsonb[]), last_checked_at.

Immutability triggers on `deploy_builds` (status transitions only, no field rewrites) and `deploy_artifacts` (append-only). Seeded 13 platform rows in the same migration.

**B. Runtime modules in `src/lib/deployment-runtime/`**

- `contracts.ts` — types shared across engine, validator, adapters.
- `platform-registry.ts` — reads registry, returns capability matrix.
- `validator.ts` — pure validators: manifest present, icons present, splash config, permissions declared, deep-link scheme, env vars set. Runs against the checked-in project, returns structured `{ok, checks[]}`.
- `build-engine.ts` — orchestrator: records `deploy_builds` row, invokes the adapter's `plan()` (never fakes an `execute()`), returns real status. Web/PWA adapters actually execute (they can run in-sandbox). Native adapters return `blocked` with the exact missing dependency.
- `adapters/{web,pwa,capacitor-android,capacitor-ios,tauri-win,tauri-mac,tauri-linux}.ts` — each exposes `plan()`, `validate()`, `execute()`. Only web + pwa implement `execute()`. Native adapters implement `plan()` and `validate()`, and `execute()` returns `{status:'blocked', reason}`.
- `signing.ts` — reads signing identity **names** from the runtime (never secret values). Actual key material must live in `add_secret` — codepath uses `process.env.*` inside handlers.
- `deployment.functions.ts` — 8 `createServerFn` endpoints: `listPlatforms`, `getCompatibilityMatrix`, `startBuild`, `getBuild`, `listBuilds`, `listArtifacts`, `getStoreReadiness`, `refreshStoreReadiness`. All admin-gated via `has_role`.

**C. PWA activation (real, in-repo)**

- Add `vite-plugin-pwa` with the guarded registration wrapper from the PWA skill (no dev/preview registration, `?sw=off` kill switch, `NetworkFirst` for HTML, `CacheFirst` for hashed assets, `/~oauth` excluded).
- Existing `public/manifest.webmanifest` already present — extend with the required icons/splash/theme entries the validator checks for.
- Registration wrapper mounted from `src/routes/__root.tsx` (client-only).

**D. Capacitor + Tauri scaffolding (planning artifacts, not binaries)**

- `capacitor.config.ts` at repo root with appId `ai.happy.enterprise`, appName, webDir `dist`, splash/statusbar plugin config.
- `src-tauri/tauri.conf.json` with product name, identifier, bundle targets per OS.
- **No** `npx cap add android/ios` and **no** `cargo tauri build` run here — those require Android Studio / Xcode / Rust toolchain / signing keys and would produce fake or broken artifacts. The build engine records these as `blocked` with the exact missing dependency string.

**E. Docs**

Update `docs/STATUS.md`, `docs/MASTER_IMPLEMENTATION_STATUS.md`, `docs/MASTER_EXECUTION_REGISTER.md` with the R61 entry and the compatibility matrix below.

---

### Compatibility matrix this pass will register

```text
Platform          Adapter          execute()   Status this pass  Blocker (if any)
─────────────────────────────────────────────────────────────────────────────────
web               web              real        WORKING            —
pwa               pwa              real        WORKING            —
android_apk       cap-android      stub        BLOCKED            Android SDK + keystore
android_aab       cap-android      stub        BLOCKED            Android SDK + Play upload key
ios / ipados      cap-ios          stub        BLOCKED            macOS host + Xcode + Apple Dev account
macos             tauri-mac        stub        BLOCKED            macOS host + Developer ID cert
windows           tauri-win        stub        BLOCKED            Windows host + code-signing cert
linux             tauri-linux      stub        PARTIAL (planned)  Rust toolchain not present in sandbox
chromeos          web              real        WORKING (via web)  —
android_tv        cap-android      stub        PLANNED            Same as android + leanback UI
wearos            companion        stub        PLANNED            Separate wear module
visionpro         cap-ios          stub        PLANNED            visionOS SDK
```

### happy.ai deployment

BLOCKED. I don't have registrar access. The runtime will record the required records so you can hand them to your DNS provider:

```text
A     @    → 185.158.133.1
A     www  → 185.158.133.1
TXT   _lovable → lovable_verify=<value shown in Project Settings → Domains>
```

After DNS resolves and Lovable verifies, SSL is auto-provisioned. I will not call `preview_ui--publish` in this pass unless you explicitly say "publish now" — you asked for a runtime build, not a live deploy.

### Store readiness

All four store rows seed as `blocked` with the exact missing dependency list (Play Console service account, App Store Connect API key, Partner Center account). They flip to `ready` only when the corresponding secrets are present — no fake "submitted" states.

---

### Explicitly out of scope (will NOT do in this pass)

- Producing an actual `.apk`, `.aab`, `.ipa`, `.msi`, `.dmg`, `.AppImage` file.
- Uploading to Google Play, App Store, Microsoft Store.
- Connecting happy.ai DNS.
- Running Playwright across native devices (sandbox has no emulators).
- Duplicating any existing runtime (voice, emotion, presentation, business, founder — all reused, not touched).

I'll run Playwright smoke on web + PWA install manifest only, which is what this sandbox can actually verify.

---

### After you approve

I'll ship in this order, in parallel where possible:
1. Migration (single file, 4 tables + seeds + triggers + GRANTs).
2. Runtime modules + server functions.
3. `vite-plugin-pwa` install + guarded registration + manifest extension.
4. `capacitor.config.ts` + `src-tauri/tauri.conf.json` scaffolds.
5. Docs update.
6. Web build check + PWA validation + report.

Reply "go" to proceed, or tell me which pieces to drop/add.