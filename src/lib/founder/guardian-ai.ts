/**
 * R160 — HAPPY Guardian AI™ (Platform Security Intelligence & Anti-Abuse)
 *
 * Pure governance + policy helper. ZERO new runtime, ZERO new tables,
 * ZERO duplicate detection engine. Every capability composes existing
 * canonical owners:
 *
 *   - Risk Engine        → `src/lib/happy-id/risk.ts` (computeRiskScore)
 *   - Identity Fortress  → `src/lib/founder/identity-fortress.ts` (R156)
 *   - Security Center    → `src/components/founder/FounderSecurityCenter.tsx` (R157)
 *   - Approval Gateway   → `src/lib/founder/approval-gateway.ts` (R158)
 *   - Intent Engine      → `src/lib/founder/intent-engine.ts` (R159)
 *   - Unlimited Policy   → `src/lib/founder/unlimited-policy.ts` (R153)
 *   - Happy ID           → `src/lib/happy-id.functions.ts`
 *   - RBAC               → `public.user_roles` / `is_platform_founder`
 *   - Audit              → `public.audit_logs` / `write_audit(...)`
 *   - Sessions/Devices   → `public.auth_sessions_meta` / `public.auth_devices`
 *
 * FOLLOWS: R91 R104 R106 R111 R114 R128 R130 R145 R153 R156 R157 R158 R159.
 * NO SECURITY V2. NO GUARDIAN V2. NO RISK V2. NO AUTH V2.
 */

// ─── Threat catalogue (18 canonical types) ───────────────────────────────
export const THREAT_TYPES = [
  "credit_abuse",
  "subscription_abuse",
  "extension_abuse",
  "modified_apk",
  "session_sharing",
  "token_replay",
  "prompt_injection",
  "ai_jailbreak",
  "api_abuse",
  "automation_abuse",
  "bot_network",
  "credential_stuffing",
  "mass_account_creation",
  "fake_referral",
  "privilege_escalation",
  "malicious_integration",
  "scraping",
  "reverse_engineering",
] as const;
export type ThreatType = (typeof THREAT_TYPES)[number];

// ─── Severity + response ladder ──────────────────────────────────────────
export const SEVERITY = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof SEVERITY)[number];

export const RESPONSE_ACTIONS = [
  "warn",
  "challenge",
  "require_otp",
  "require_founder_approval",
  "freeze_session",
  "freeze_user",
  "freeze_workspace",
  "freeze_company",
  "investigation_mode",
] as const;
export type ResponseAction = (typeof RESPONSE_ACTIONS)[number];

// ─── Threat timeline event contract ─────────────────────────────────────
export const TIMELINE_FIELDS = [
  "who", "what", "when", "where",
  "device", "browser", "ip", "location",
  "workspace", "company", "action", "risk", "response",
] as const;
export type TimelineField = (typeof TIMELINE_FIELDS)[number];

// ─── Anti-abuse subsystem catalogue ─────────────────────────────────────
export const ANTI_CREDIT_SIGNALS = [
  "credit_bypass", "fake_balance", "duplicate_wallet_tx",
  "subscription_manipulation", "coupon_abuse", "referral_abuse", "reward_abuse",
] as const;

export const ANTI_SESSION_SIGNALS = [
  "impossible_sessions", "account_sharing", "device_cloning",
  "token_replay", "expired_token_reuse", "session_hijacking",
] as const;

export const ANTI_EXTENSION_SIGNALS = [
  "browser_automation", "known_extension_signature",
  "tampered_request", "modified_frontend_payload", "client_state_manipulation",
] as const;

export const ANTI_APK_SIGNALS = [
  "app_integrity", "signature_validation", "tamper_detection",
  "debug_detection", "integrity_check", "server_side_verification",
] as const;

export const ANTI_AI_SIGNALS = [
  "prompt_injection", "jailbreak", "token_flood",
  "context_poisoning", "ai_spam", "prompt_loop",
] as const;

export const ANTI_API_SIGNALS = [
  "rate_bypass", "replay", "malformed_payload",
  "mass_scraping", "enumeration", "credential_attack",
] as const;

export const ANTI_BOT_SIGNALS = [
  "automation", "headless_browser", "mass_registration",
  "mass_login", "traffic_anomaly",
] as const;

// ─── AI Security Officer briefs ─────────────────────────────────────────
export const OFFICER_BRIEFS = ["morning", "evening", "weekly", "monthly"] as const;
export type OfficerBrief = (typeof OFFICER_BRIEFS)[number];

// ─── Founder alert channels ─────────────────────────────────────────────
export const ALERT_CHANNELS = ["dashboard", "push", "email", "whatsapp"] as const;
export type AlertChannel = (typeof ALERT_CHANNELS)[number];

// ─── Pipeline (Detect → Score → Classify → Respond → Alert → Audit) ─────
export const GUARDIAN_PIPELINE = [
  "capture",       // reuse audit_logs / auth_login_history
  "detect",        // signal from anti-* subsystem
  "score",         // reuse computeRiskScore (R114.3)
  "classify",      // severity ladder
  "respond",       // response action from ladder
  "alert",         // founder channels (critical/high only)
  "audit",         // write_audit()
  "learn",         // brain/memory feedback (R114/R128)
] as const;

// ─── Risk-score → severity ──────────────────────────────────────────────
export function severityForScore(score: number): Severity {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 90) return "critical";
  if (s >= 70) return "high";
  if (s >= 40) return "medium";
  return "low";
}

// ─── Severity → response action ─────────────────────────────────────────
export function responseForSeverity(sev: Severity, threat: ThreatType): ResponseAction {
  // Privilege escalation and modified APK are always max-severity outcomes.
  if (threat === "privilege_escalation" || threat === "modified_apk") {
    return sev === "critical" ? "freeze_user" : "require_founder_approval";
  }
  switch (sev) {
    case "critical": return "investigation_mode";
    case "high":     return "require_founder_approval";
    case "medium":   return "require_otp";
    case "low":      return "warn";
  }
}

// ─── Founder-alert gate (critical/high only) ────────────────────────────
export function shouldAlertFounder(sev: Severity): boolean {
  return sev === "critical" || sev === "high";
}

// ─── Safe Mode threshold ────────────────────────────────────────────────
export const SAFE_MODE_THRESHOLD = {
  criticalEventsPerHour: 10,
  highEventsPerHour: 50,
} as const;

export function shouldEnableSafeMode(input: {
  criticalLastHour: number;
  highLastHour: number;
}): boolean {
  return (
    input.criticalLastHour >= SAFE_MODE_THRESHOLD.criticalEventsPerHour ||
    input.highLastHour >= SAFE_MODE_THRESHOLD.highEventsPerHour
  );
}

// ─── Guardian event contract (persisted via audit_logs, not a new table) ─
export interface GuardianEvent {
  threat: ThreatType;
  score: number;              // 0..100 from computeRiskScore
  severity: Severity;         // derived
  response: ResponseAction;   // derived
  timeline: Record<TimelineField, string | number | undefined>;
  alertFounder: boolean;
  createdAt: string;          // ISO
}

export function classifyEvent(input: {
  threat: ThreatType;
  score: number;
  timeline: Partial<Record<TimelineField, string | number>>;
  now?: Date;
}): GuardianEvent {
  const severity = severityForScore(input.score);
  const response = responseForSeverity(severity, input.threat);
  const now = input.now ?? new Date();
  const full: Record<TimelineField, string | number | undefined> = {
    who: undefined, what: undefined, when: now.toISOString(), where: undefined,
    device: undefined, browser: undefined, ip: undefined, location: undefined,
    workspace: undefined, company: undefined, action: input.threat,
    risk: input.score, response,
    ...input.timeline,
  };
  return {
    threat: input.threat,
    score: Math.max(0, Math.min(100, Math.round(input.score))),
    severity,
    response,
    timeline: full,
    alertFounder: shouldAlertFounder(severity),
    createdAt: now.toISOString(),
  };
}

// ─── Investigation-center evidence bundle (pure projection) ─────────────
export interface InvestigationSnapshot {
  event: GuardianEvent;
  suggestedAction: ResponseAction;
  evidenceFields: TimelineField[];
  auditRequired: boolean;      // always true — audit_logs write is mandatory
  approvalRequired: boolean;   // ties into R158
}

export function investigationSnapshot(event: GuardianEvent): InvestigationSnapshot {
  return {
    event,
    suggestedAction: event.response,
    evidenceFields: [...TIMELINE_FIELDS],
    auditRequired: true,
    approvalRequired:
      event.response === "require_founder_approval" ||
      event.response === "investigation_mode" ||
      event.response === "freeze_company",
  };
}

// ─── AI Security Officer summary shape (pure projection) ────────────────
export interface OfficerReport {
  brief: OfficerBrief;
  windowHours: number;
  counts: Record<Severity, number>;
  topThreats: ThreatType[];
  safeModeRecommended: boolean;
}

const BRIEF_WINDOWS: Record<OfficerBrief, number> = {
  morning: 12, evening: 12, weekly: 168, monthly: 720,
};

export function summarizeEvents(brief: OfficerBrief, events: GuardianEvent[]): OfficerReport {
  const counts: Record<Severity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const threatTally = new Map<ThreatType, number>();
  for (const e of events) {
    counts[e.severity]++;
    threatTally.set(e.threat, (threatTally.get(e.threat) ?? 0) + 1);
  }
  const topThreats = [...threatTally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);
  return {
    brief,
    windowHours: BRIEF_WINDOWS[brief],
    counts,
    topThreats,
    safeModeRecommended: shouldEnableSafeMode({
      criticalLastHour: counts.critical,
      highLastHour: counts.high,
    }),
  };
}

// ─── Guardian meta (for dashboards / docs / audits) ─────────────────────
export const GUARDIAN_META = {
  version: "R160",
  canonicalOwners: [
    "src/lib/happy-id/risk.ts",
    "src/lib/founder/identity-fortress.ts",
    "src/lib/founder/approval-gateway.ts",
    "src/lib/founder/intent-engine.ts",
    "src/components/founder/FounderSecurityCenter.tsx",
    "public.audit_logs",
    "public.auth_sessions_meta",
    "public.auth_devices",
  ],
  threatCount: THREAT_TYPES.length,
  pipelineStages: GUARDIAN_PIPELINE.length,
  createsNewRuntime: false,
  createsNewTables: false,
  duplicatesDetectionEngine: false,
} as const;
