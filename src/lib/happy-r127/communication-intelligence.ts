/**
 * R127 — HAPPY Communication Hub Intelligence™ (pure extension layer)
 *
 * FOUNDER LOCK (R91 / R111):
 *   - No Notification V2. No Templates V2. No Automation V2. No duplicate runtimes.
 *   - Canonical owners (extended, never replaced):
 *       Notifications          → `src/services/domain/notification.service.ts`
 *                              + `src/lib/notification-center.functions.ts`
 *       Templates              → `src/lib/template-v1.functions.ts`
 *       Automation runtime     → `src/lib/automation-runtime-v3.functions.ts`
 *       Communication surface  → `src/lib/communications-v16.functions.ts`
 *       Brain / Memory / Workspace / Search / Files / Digital Human — R115–R120.
 *
 * Pure helpers only — no I/O, no persistence, no provider SDKs. Transports
 * (Email/SMS/Push/Webhook) live behind the existing runtime; this file only
 * classifies, routes, renders, throttles, batches, and scores.
 */

// ============================================================================
// Types
// ============================================================================

export type CommChannel = "in_app" | "email" | "sms" | "push" | "webhook" | "voice" | "whatsapp";
export type CommKind =
  | "system" | "security" | "billing" | "deployment" | "marketplace"
  | "digital_human" | "workflow" | "crm" | "erp" | "hrms"
  | "inventory" | "creator" | "marketing" | "support" | "chat"
  | "reminder" | "invite" | "otp";

export type CommPriority = "low" | "normal" | "high" | "urgent" | "critical";
export type CommRole = "viewer" | "member" | "operator" | "manager" | "admin" | "founder";
export type CommCap =
  | "view" | "send" | "broadcast" | "template_edit" | "automation_edit"
  | "preferences_edit" | "delete" | "analytics" | "impersonate";

export type CommDhMode = "assistant" | "presenter" | "concierge" | "alert" | "silent";

export interface CommMessage {
  kind: CommKind;
  title: string;
  body?: string;
  channel?: CommChannel;
  priority?: CommPriority;
  payload?: Record<string, unknown>;
}

// ============================================================================
// Classification
// ============================================================================

const KIND_KEYWORDS: Array<[CommKind, RegExp]> = [
  ["security",      /\b(sign[- ]?in|login|password|breach|2fa|otp|token|risk)\b/i],
  ["billing",       /\b(invoice|payment|charge|refund|subscription|plan|receipt)\b/i],
  ["deployment",    /\b(deploy(ed|ment)?|release|rollback|build|pipeline)\b/i],
  ["marketplace",   /\b(listing|marketplace|storefront|catalog)\b/i],
  ["digital_human", /\b(happy|assistant|companion|digital human)\b/i],
  ["workflow",      /\b(workflow|automation|trigger|approval)\b/i],
  ["crm",           /\b(lead|deal|contact|customer|pipeline)\b/i],
  ["erp",           /\b(purchase order|\bpo\b|supplier|vendor|bom|work order)\b/i],
  ["hrms",          /\b(payroll|leave|attendance|employee|hire|offer)\b/i],
  ["inventory",     /\b(stock|inventory|warehouse|reorder|sku)\b/i],
  ["creator",       /\b(render|studio|scene|clip|thumbnail|caption)\b/i],
  ["marketing",     /\b(campaign|newsletter|blast|utm|open rate)\b/i],
  ["support",       /\b(ticket|support|incident|helpdesk)\b/i],
  ["reminder",      /\b(reminder|due|scheduled|upcoming)\b/i],
  ["invite",        /\b(invite|invitation|join|access granted)\b/i],
  ["otp",           /\b(otp|verification code|one[- ]time)\b/i],
];

export function classifyKind(subject: string, fallback: CommKind = "system"): CommKind {
  const s = subject ?? "";
  for (const [k, re] of KIND_KEYWORDS) if (re.test(s)) return k;
  return fallback;
}

const PRIORITY_KEYWORDS: Array<[CommPriority, RegExp]> = [
  ["critical", /\b(critical|breach|outage|down|failed|urgent action)\b/i],
  ["urgent",   /\b(urgent|immediately|asap|blocker)\b/i],
  ["high",     /\b(important|attention|expir(y|ing|es)|overdue)\b/i],
  ["low",      /\b(fyi|digest|weekly|monthly|newsletter)\b/i],
];

export function classifyPriority(text: string, base: CommPriority = "normal"): CommPriority {
  for (const [p, re] of PRIORITY_KEYWORDS) if (re.test(text)) return p;
  return base;
}

// ============================================================================
// Channel routing
// ============================================================================

const DEFAULT_CHANNELS: Record<CommKind, CommChannel[]> = {
  system:        ["in_app"],
  security:      ["in_app", "email", "push"],
  billing:       ["email", "in_app"],
  deployment:    ["in_app", "push"],
  marketplace:   ["in_app", "email"],
  digital_human: ["in_app"],
  workflow:      ["in_app", "email"],
  crm:           ["in_app", "email"],
  erp:           ["in_app", "email"],
  hrms:          ["in_app", "email"],
  inventory:     ["in_app"],
  creator:       ["in_app"],
  marketing:     ["email", "in_app"],
  support:       ["in_app", "email"],
  chat:          ["in_app", "push"],
  reminder:      ["in_app", "push", "email"],
  invite:        ["email", "in_app"],
  otp:           ["sms", "email"],
};

export interface RoutePreference {
  kind: CommKind;
  channel: CommChannel;
  enabled: boolean;
}

export function pickChannels(
  kind: CommKind,
  priority: CommPriority,
  prefs: RoutePreference[] = [],
): CommChannel[] {
  const base = DEFAULT_CHANNELS[kind] ?? ["in_app"];
  const isCritical = priority === "critical" || priority === "urgent";
  const merged = new Set<CommChannel>(base);
  if (isCritical) { merged.add("push"); merged.add("email"); }
  const disabled = new Set(
    prefs.filter((p) => p.kind === kind && p.enabled === false).map((p) => p.channel),
  );
  const out = Array.from(merged).filter((c) => !disabled.has(c));
  return out.length ? out : ["in_app"];
}

// ============================================================================
// Template rendering (safe {{var}} interpolation)
// ============================================================================

const TAG = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export function renderTemplate(template: string, vars: Record<string, unknown> = {}): string {
  return String(template ?? "").replace(TAG, (_, key: string) => {
    const path = key.split(".");
    let cur: unknown = vars;
    for (const p of path) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else { return ""; }
    }
    return cur == null ? "" : String(cur);
  });
}

export function extractTemplateVars(template: string): string[] {
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(TAG);
  while ((m = re.exec(template)) !== null) out.add(m[1]);
  return Array.from(out);
}

export function validateTemplate(
  template: string,
  required: string[] = [],
): { ok: boolean; missing: string[]; used: string[] } {
  const used = extractTemplateVars(template);
  const missing = required.filter((r) => !used.includes(r));
  return { ok: missing.length === 0, missing, used };
}

// ============================================================================
// Throttle / dedupe / batching
// ============================================================================

export interface ThrottleWindow { kind: CommKind; channel: CommChannel; per_hour: number }

const DEFAULT_THROTTLE: ThrottleWindow[] = [
  { kind: "marketing", channel: "email", per_hour: 2 },
  { kind: "marketing", channel: "sms",   per_hour: 1 },
  { kind: "reminder",  channel: "push",  per_hour: 6 },
  { kind: "system",    channel: "in_app", per_hour: 30 },
];

export function throttleLimit(kind: CommKind, channel: CommChannel, overrides: ThrottleWindow[] = []): number {
  const rule = [...overrides, ...DEFAULT_THROTTLE].find((r) => r.kind === kind && r.channel === channel);
  return rule?.per_hour ?? 20;
}

export function shouldThrottle(
  kind: CommKind, channel: CommChannel,
  recentTimestamps: number[], nowMs: number = Date.now(),
  overrides: ThrottleWindow[] = [],
): boolean {
  const limit = throttleLimit(kind, channel, overrides);
  const hourAgo = nowMs - 3600_000;
  const inWindow = recentTimestamps.filter((t) => t >= hourAgo).length;
  return inWindow >= limit;
}

export function dedupeKey(m: Pick<CommMessage, "kind" | "title" | "channel">): string {
  return `${m.kind}|${m.channel ?? "in_app"}|${(m.title ?? "").trim().toLowerCase()}`;
}

export function dedupeMessages<T extends Pick<CommMessage, "kind" | "title" | "channel">>(list: T[]): T[] {
  const seen = new Set<string>(); const out: T[] = [];
  for (const m of list) { const k = dedupeKey(m); if (!seen.has(k)) { seen.add(k); out.push(m); } }
  return out;
}

export function batchDigest<T extends CommMessage>(
  list: T[], maxPerGroup = 10,
): Array<{ kind: CommKind; count: number; items: T[] }> {
  const groups = new Map<CommKind, T[]>();
  for (const m of list) {
    const arr = groups.get(m.kind) ?? [];
    arr.push(m); groups.set(m.kind, arr);
  }
  return Array.from(groups.entries()).map(([kind, items]) => ({
    kind, count: items.length, items: items.slice(0, maxPerGroup),
  }));
}

// ============================================================================
// Quiet hours
// ============================================================================

export interface QuietHours { start_hour: number; end_hour: number; tz_offset_min?: number }

export function inQuietHours(nowMs: number, qh?: QuietHours): boolean {
  if (!qh) return false;
  const offset = (qh.tz_offset_min ?? 0) * 60_000;
  const hour = new Date(nowMs + offset).getUTCHours();
  if (qh.start_hour === qh.end_hour) return false;
  if (qh.start_hour < qh.end_hour) return hour >= qh.start_hour && hour < qh.end_hour;
  return hour >= qh.start_hour || hour < qh.end_hour;
}

export function deferForQuietHours(
  priority: CommPriority, nowMs: number, qh?: QuietHours,
): boolean {
  if (priority === "critical" || priority === "urgent") return false;
  return inQuietHours(nowMs, qh);
}

// ============================================================================
// Automation runtime helpers (pure)
// ============================================================================

export type AutomationTriggerKind =
  | "event" | "schedule" | "webhook" | "manual" | "condition";

export interface AutomationRule {
  id: string;
  trigger: AutomationTriggerKind;
  when?: (ctx: Record<string, unknown>) => boolean;
  emit: Omit<CommMessage, "channel"> & { channel?: CommChannel };
}

export function evaluateRules(
  rules: AutomationRule[], ctx: Record<string, unknown>,
): AutomationRule[] {
  return rules.filter((r) => (r.when ? safeBool(() => r.when!(ctx)) : true));
}

function safeBool(f: () => unknown): boolean { try { return Boolean(f()); } catch { return false; } }

// ============================================================================
// Delivery scoring / analytics
// ============================================================================

export interface DeliveryStats {
  sent: number; delivered: number; opened: number; clicked: number;
  bounced: number; failed: number; unsubscribed: number;
}

export function deliveryRate(s: DeliveryStats): number {
  return s.sent > 0 ? s.delivered / s.sent : 0;
}
export function openRate(s: DeliveryStats): number {
  return s.delivered > 0 ? s.opened / s.delivered : 0;
}
export function clickThroughRate(s: DeliveryStats): number {
  return s.opened > 0 ? s.clicked / s.opened : 0;
}
export function bounceRate(s: DeliveryStats): number {
  return s.sent > 0 ? s.bounced / s.sent : 0;
}

export function channelHealth(s: DeliveryStats): { grade: "A" | "B" | "C" | "D" | "F"; issues: string[] } {
  const issues: string[] = [];
  const dr = deliveryRate(s), br = bounceRate(s), or = openRate(s);
  if (dr < 0.95) issues.push("low_delivery");
  if (br > 0.05) issues.push("high_bounce");
  if (or < 0.1 && s.delivered > 20) issues.push("low_open");
  const score = 100 - issues.length * 20;
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  return { grade, issues };
}

// ============================================================================
// Brain + DH integration
// ============================================================================

export type CommIntent =
  | "send" | "schedule" | "template" | "automation"
  | "preferences" | "analytics" | "digest" | "unsubscribe";

const INTENT_MAP: Array<[CommIntent, RegExp]> = [
  ["send",         /\b(send|notify|alert|email|sms|push)\b/i],
  ["schedule",     /\b(schedul|later|remind me)\b/i],
  ["template",     /\b(template|draft|snippet)\b/i],
  ["automation",   /\b(automation|workflow|trigger|rule)\b/i],
  ["preferences",  /\b(preferences|settings|mute|silence|quiet)\b/i],
  ["analytics",    /\b(analytics|report|open rate|delivery|stats)\b/i],
  ["digest",       /\b(digest|summary|roll[- ]?up)\b/i],
  ["unsubscribe",  /\b(unsubscribe|opt[- ]?out)\b/i],
];

export function classifyCommIntent(q: string): CommIntent | null {
  for (const [k, re] of INTENT_MAP) if (re.test(q)) return k;
  return null;
}

export function resolveForBrain(query: string): {
  intent: CommIntent; route: string; suggestions: string[];
} | null {
  const intent = classifyCommIntent(query);
  if (!intent) return null;
  const routeMap: Record<CommIntent, string> = {
    send:         "/notifications",
    schedule:     "/notifications",
    template:     "/notifications/templates",
    automation:   "/automations",
    preferences:  "/notifications/preferences",
    analytics:    "/notifications/analytics",
    digest:       "/notifications",
    unsubscribe:  "/notifications/preferences",
  };
  return {
    intent,
    route: routeMap[intent],
    suggestions: [
      "Open notifications", "Review templates",
      "Adjust preferences", "See delivery analytics",
    ],
  };
}

export function pickDhCommMode(intent: CommIntent | CommKind): CommDhMode {
  switch (intent) {
    case "security": case "billing": case "critical" as never: return "alert";
    case "marketing": case "invite":                            return "presenter";
    case "support":                                             return "concierge";
    case "digest": case "analytics":                            return "assistant";
    case "preferences": case "unsubscribe":                     return "silent";
    default:                                                    return "assistant";
  }
}

// ============================================================================
// Permissions (6 roles × 9 caps)
// ============================================================================

const MATRIX: Record<CommRole, Set<CommCap>> = {
  viewer:   new Set(["view"]),
  member:   new Set(["view", "preferences_edit"]),
  operator: new Set(["view", "send", "preferences_edit"]),
  manager:  new Set(["view", "send", "broadcast", "template_edit", "preferences_edit", "analytics"]),
  admin:    new Set(["view", "send", "broadcast", "template_edit", "automation_edit",
                     "preferences_edit", "delete", "analytics"]),
  founder:  new Set(["view", "send", "broadcast", "template_edit", "automation_edit",
                     "preferences_edit", "delete", "analytics", "impersonate"]),
};

export function commCan(role: CommRole, cap: CommCap): boolean {
  return MATRIX[role]?.has(cap) ?? false;
}

// ============================================================================
// Snapshot
// ============================================================================

export interface CommSnapshotItem { kind: CommKind; channel: CommChannel; stats: DeliveryStats }

export function commSnapshot(items: CommSnapshotItem[]): {
  total_sent: number; by_channel: Record<string, number>; by_kind: Record<string, number>;
  overall: DeliveryStats;
} {
  const by_channel: Record<string, number> = {};
  const by_kind: Record<string, number> = {};
  const overall: DeliveryStats = {
    sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, failed: 0, unsubscribed: 0,
  };
  for (const i of items) {
    by_channel[i.channel] = (by_channel[i.channel] ?? 0) + i.stats.sent;
    by_kind[i.kind] = (by_kind[i.kind] ?? 0) + i.stats.sent;
    for (const k of Object.keys(overall) as (keyof DeliveryStats)[]) overall[k] += i.stats[k];
  }
  return { total_sent: overall.sent, by_channel, by_kind, overall };
}
