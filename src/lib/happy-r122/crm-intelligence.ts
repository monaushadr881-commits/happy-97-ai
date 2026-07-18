/**
 * R122 — HAPPY CRM Intelligence™ (pure extension layer)
 *
 * FOUNDER LOCK (R91 / R111):
 *   - No CRM V2. No duplicate customer database. No duplicate pipeline.
 *   - Canonical CRM owner: `src/lib/crm/engine.ts` + `src/lib/crm/crm.functions.ts`.
 *   - Related canonical owners we integrate with (never duplicate):
 *       Company/Org      → `src/services/domain/company.service.ts`
 *       Workspace        → `src/services/domain/workspace.service.ts`   (+ R118)
 *       Brain            → `src/lib/brain/engine.ts`                     (R115.b/.c)
 *       Memory           → `src/lib/memory/engine.ts`                    (R116)
 *       Search           → `src/services/domain/search.service.ts`       (+ R120)
 *       Files            → `src/lib/happy-r112/files-upload.ts`          (+ R119)
 *       Digital Human    → `src/components/happy-desk/HappyDesk.tsx`     (+ R117)
 *       Communication    → `src/lib/communications-v16.functions.ts` (canonical)
 *       ERP/Invoices     → `src/lib/erp/*`
 *       Meetings         → `src/lib/meeting-runtime/*`
 *       Payments         → `src/lib/payments/*`
 *
 * This module contains PURE helpers. It does not open sockets, own state,
 * or write to the DB — callers pass rows in and receive intelligence out.
 * All CRUD keeps flowing through the canonical `crm.functions.ts` surface.
 */

// ============================================================================
// Phase 2 — CRM_ARCHITECTURE_V2 (types)
// ============================================================================

/** Party unifies Lead / Contact / Customer / Company / Organization / Individual. */
export type PartyKind = "lead" | "contact" | "customer" | "company" | "organization" | "individual";

/** Canonical sales pipeline stages. Custom pipelines map onto these buckets. */
export type PipelineStage =
  | "lead" | "qualified" | "meeting" | "proposal" | "negotiation" | "won" | "lost";

export const CANONICAL_PIPELINE: PipelineStage[] = [
  "lead", "qualified", "meeting", "proposal", "negotiation", "won", "lost",
];

/** Communication channels unified across email/phone/chat/meetings/notes. */
export type CommChannel =
  | "email" | "phone" | "whatsapp" | "sms" | "note" | "meeting" | "call" | "chat" | "doc";

/** 13-permission x 6-role matrix for CRM entities. Extends R118 workspace roles. */
export type CrmRole =
  | "owner" | "admin" | "sales_manager" | "sales_rep" | "support" | "viewer";
export type CrmCap =
  | "view" | "create" | "edit" | "delete" | "assign"
  | "export" | "import" | "convert" | "merge"
  | "message" | "quote" | "invoice" | "refund";

// ============================================================================
// Phase 3 — Party normalization
// ============================================================================

export interface PartyInput {
  kind?: PartyKind;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_id?: string | null;
  is_org?: boolean | null;
}

export function classifyParty(p: PartyInput): PartyKind {
  if (p.kind) return p.kind;
  if (p.is_org) return "organization";
  if (p.company_id && !p.email && !p.phone) return "company";
  if (p.email && p.name) return "contact";
  return "lead";
}

// ============================================================================
// Phase 4 — Pipeline
// ============================================================================

/** Map any free-form stage string onto the canonical pipeline. */
export function normalizeStage(raw: string | null | undefined): PipelineStage {
  const s = (raw ?? "").toLowerCase().trim();
  if (!s) return "lead";
  if (/(win|won|closed[- ]?won|success)/.test(s)) return "won";
  if (/(lose|lost|closed[- ]?lost|dropped)/.test(s)) return "lost";
  if (/(negoti)/.test(s)) return "negotiation";
  if (/(propos|quote|offer)/.test(s)) return "proposal";
  if (/(meet|demo|call scheduled)/.test(s)) return "meeting";
  if (/(qualif|nurtur)/.test(s)) return "qualified";
  return "lead";
}

export function stageProgress(stage: PipelineStage): number {
  const idx = CANONICAL_PIPELINE.indexOf(stage);
  if (stage === "lost") return 0;
  if (stage === "won") return 1;
  return Math.max(0, idx) / (CANONICAL_PIPELINE.length - 2); // 0..1 across active stages
}

// ============================================================================
// Phase 5 — Communication Hub — unify heterogeneous rows into a timeline
// ============================================================================

export interface CommEvent {
  id: string;
  at: string;                // ISO
  channel: CommChannel;
  direction?: "in" | "out" | "internal";
  subject?: string;
  preview?: string;
  party_id?: string | null;
  entity_type?: "lead" | "customer" | "deal" | "company" | "contact";
  entity_id?: string | null;
}

/** Sort + de-dupe a mixed list of comm events into a single timeline. */
export function buildTimeline(events: CommEvent[]): CommEvent[] {
  const seen = new Set<string>();
  return events
    .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

// ============================================================================
// Phase 6 — Tasks / follow-ups
// ============================================================================

export interface TaskLike {
  due_at?: string | null;
  status?: string | null;
  priority?: string | null;
}

export function taskUrgency(t: TaskLike, now = Date.now()): "overdue" | "today" | "soon" | "later" | "none" {
  if (!t.due_at || t.status === "done" || t.status === "cancelled") return "none";
  const d = new Date(t.due_at).getTime();
  if (isNaN(d)) return "none";
  const dayMs = 24 * 3600 * 1000;
  if (d < now) return "overdue";
  if (d < now + dayMs) return "today";
  if (d < now + 3 * dayMs) return "soon";
  return "later";
}

// ============================================================================
// Phase 7 — AI CRM Intelligence
// ============================================================================

export interface LeadSignals {
  source?: string | null;
  email?: string | null;
  phone?: string | null;
  company_id?: string | null;
  activityCount?: number;
  lastActivityAt?: string | null;
  emailOpens?: number;
  meetingsHeld?: number;
  budgetKnown?: boolean;
}

/** Deterministic lead score 0..100 (pure). Real ML lives behind Brain. */
export function scoreLead(s: LeadSignals): number {
  let n = 0;
  if (s.email) n += 10;
  if (s.phone) n += 10;
  if (s.company_id) n += 10;
  if (s.budgetKnown) n += 15;
  n += Math.min(20, (s.activityCount ?? 0) * 2);
  n += Math.min(15, (s.emailOpens ?? 0) * 3);
  n += Math.min(20, (s.meetingsHeld ?? 0) * 10);
  if (s.source && /(referr|partner)/i.test(s.source)) n += 10;
  return Math.max(0, Math.min(100, n));
}

export interface DealSignals {
  stage: PipelineStage;
  amount_cents?: number | null;
  expected_close_at?: string | null;
  lastActivityAt?: string | null;
  daysSinceLastActivity?: number;
  ownerAssigned?: boolean;
}

/** Risk 0..1 (higher = more at risk of stalling). */
export function dealRisk(d: DealSignals, now = Date.now()): number {
  let r = 0;
  if (d.stage === "lost") return 1;
  if (d.stage === "won") return 0;
  const idle = d.daysSinceLastActivity
    ?? (d.lastActivityAt ? Math.floor((now - new Date(d.lastActivityAt).getTime()) / 86400000) : 30);
  r += Math.min(0.5, idle / 60);
  if (!d.ownerAssigned) r += 0.15;
  if (d.expected_close_at && new Date(d.expected_close_at).getTime() < now) r += 0.25;
  if (d.stage === "negotiation" && idle > 14) r += 0.1;
  return Math.max(0, Math.min(1, r));
}

export type NextBestAction =
  | "call" | "email" | "whatsapp" | "meeting" | "quote" | "proposal" | "close" | "reassign" | "nurture";

export function nextBestAction(d: DealSignals & { risk?: number }): NextBestAction {
  const r = d.risk ?? dealRisk(d);
  if (d.stage === "lead") return "email";
  if (d.stage === "qualified") return "meeting";
  if (d.stage === "meeting") return "proposal";
  if (d.stage === "proposal") return r > 0.5 ? "call" : "quote";
  if (d.stage === "negotiation") return r > 0.6 ? "reassign" : "close";
  return "nurture";
}

/** Compact summary line for a customer/lead card. */
export function summarizeCustomer(rows: CommEvent[]): string {
  if (!rows.length) return "No recent activity.";
  const last = rows[0];
  const byCh: Record<string, number> = {};
  for (const r of rows) byCh[r.channel] = (byCh[r.channel] ?? 0) + 1;
  const top = Object.entries(byCh).sort((a, b) => b[1] - a[1]).slice(0, 2)
    .map(([k, v]) => `${v} ${k}`).join(", ");
  return `Last ${last.channel} ${new Date(last.at).toLocaleDateString()} · ${top}.`;
}

// ============================================================================
// Phase 8 — Relationship Intelligence
// ============================================================================

export interface RelationshipSnapshot {
  totalInteractions: number;
  lastInteractionAt: string | null;
  channels: Record<CommChannel, number>;
  invoicesCount: number;
  supportOpen: number;
  documentsCount: number;
  aiSummary: string;
}

export function buildRelationshipSnapshot(input: {
  timeline: CommEvent[];
  invoices?: number;
  supportOpen?: number;
  documents?: number;
}): RelationshipSnapshot {
  const channels = {} as Record<CommChannel, number>;
  for (const e of input.timeline) channels[e.channel] = (channels[e.channel] ?? 0) + 1;
  return {
    totalInteractions: input.timeline.length,
    lastInteractionAt: input.timeline[0]?.at ?? null,
    channels,
    invoicesCount: input.invoices ?? 0,
    supportOpen: input.supportOpen ?? 0,
    documentsCount: input.documents ?? 0,
    aiSummary: summarizeCustomer(input.timeline),
  };
}

// ============================================================================
// Phase 9 — Automation planner (declarative — executor is Workflow runtime)
// ============================================================================

export type AutomationTrigger =
  | "lead.created" | "lead.qualified" | "deal.stage_changed" | "deal.stalled"
  | "task.overdue" | "customer.no_contact_30d" | "invoice.paid" | "invoice.overdue";

export interface AutomationRule {
  trigger: AutomationTrigger;
  action: NextBestAction | "assign" | "reminder" | "email_template" | "whatsapp_template";
  delayMinutes?: number;
  templateKey?: string;
}

export function defaultAutomationRules(): AutomationRule[] {
  return [
    { trigger: "lead.created", action: "assign" },
    { trigger: "lead.created", action: "email_template", delayMinutes: 5, templateKey: "welcome_lead" },
    { trigger: "lead.qualified", action: "meeting", delayMinutes: 60 },
    { trigger: "deal.stalled", action: "call" },
    { trigger: "task.overdue", action: "reminder" },
    { trigger: "customer.no_contact_30d", action: "whatsapp_template", templateKey: "checkin" },
    { trigger: "invoice.overdue", action: "email_template", templateKey: "invoice_reminder" },
  ];
}

// ============================================================================
// Phase 10 — Analytics
// ============================================================================

export interface FunnelBucket { stage: PipelineStage; count: number; value_cents: number }

export function buildFunnel(
  deals: { stage?: string | null; amount_cents?: number | null }[],
): FunnelBucket[] {
  const buckets = new Map<PipelineStage, FunnelBucket>();
  for (const s of CANONICAL_PIPELINE) buckets.set(s, { stage: s, count: 0, value_cents: 0 });
  for (const d of deals) {
    const s = normalizeStage(d.stage);
    const b = buckets.get(s)!;
    b.count += 1;
    b.value_cents += d.amount_cents ?? 0;
  }
  return CANONICAL_PIPELINE.map((s) => buckets.get(s)!);
}

export function conversionRate(funnel: FunnelBucket[]): number {
  const entered = funnel.filter((f) => f.stage !== "lost").reduce((a, b) => a + b.count, 0);
  const won = funnel.find((f) => f.stage === "won")?.count ?? 0;
  return entered ? won / entered : 0;
}

export function forecastRevenueCents(
  deals: { stage?: string | null; amount_cents?: number | null }[],
  weights: Partial<Record<PipelineStage, number>> = {},
): number {
  const w: Record<PipelineStage, number> = {
    lead: 0.05, qualified: 0.15, meeting: 0.3,
    proposal: 0.5, negotiation: 0.7, won: 1, lost: 0, ...weights,
  };
  let total = 0;
  for (const d of deals) {
    const s = normalizeStage(d.stage);
    total += (d.amount_cents ?? 0) * w[s];
  }
  return Math.round(total);
}

// ============================================================================
// Phase 11 — Brain integration (Stage 6 retrieval hint)
// ============================================================================

export interface BrainCrmHint {
  wantsCrm: boolean;
  entity?: "lead" | "customer" | "deal" | "company" | "contact";
  action?: NextBestAction;
  reason: string;
}

export function resolveForBrain(prompt: string): BrainCrmHint {
  const p = prompt.toLowerCase();
  const wantsCrm = /(lead|customer|client|deal|pipeline|sales|quote|invoice|follow[- ]?up|crm|prospect|contact)/.test(p);
  if (!wantsCrm) return { wantsCrm: false, reason: "no crm keywords" };
  let entity: BrainCrmHint["entity"] = "customer";
  if (/(lead|prospect)/.test(p)) entity = "lead";
  else if (/(deal|opportunity|pipeline|quote)/.test(p)) entity = "deal";
  else if (/(company|account|org)/.test(p)) entity = "company";
  else if (/(contact|person)/.test(p)) entity = "contact";
  let action: NextBestAction | undefined;
  if (/(call)/.test(p)) action = "call";
  else if (/(email|mail)/.test(p)) action = "email";
  else if (/(whatsapp|wa)/.test(p)) action = "whatsapp";
  else if (/(meet|demo)/.test(p)) action = "meeting";
  else if (/(close|win)/.test(p)) action = "close";
  return { wantsCrm: true, entity, action, reason: `crm:${entity}${action ? `:${action}` : ""}` };
}

// ============================================================================
// Phase 12 — Digital Human mode selection for CRM contexts
// ============================================================================

export type DhCrmMode =
  | "business" | "sales" | "presentation" | "meeting" | "customer_explanation";

export function pickDhCrmMode(ctx: {
  route?: string; stage?: PipelineStage; hasSlides?: boolean; inMeeting?: boolean;
}): DhCrmMode {
  if (ctx.inMeeting) return "meeting";
  if (ctx.hasSlides) return "presentation";
  if (ctx.stage === "proposal" || ctx.stage === "negotiation") return "sales";
  if (ctx.route && /explain|help|support/.test(ctx.route)) return "customer_explanation";
  return "business";
}

// ============================================================================
// Phase — Permissions (extends R118 workspace roles)
// ============================================================================

const CAP_MATRIX: Record<CrmRole, CrmCap[]> = {
  owner:         ["view","create","edit","delete","assign","export","import","convert","merge","message","quote","invoice","refund"],
  admin:         ["view","create","edit","delete","assign","export","import","convert","merge","message","quote","invoice","refund"],
  sales_manager: ["view","create","edit","assign","export","convert","merge","message","quote","invoice"],
  sales_rep:     ["view","create","edit","convert","message","quote"],
  support:       ["view","message"],
  viewer:        ["view"],
};

export function crmCan(role: CrmRole, cap: CrmCap): boolean {
  return CAP_MATRIX[role]?.includes(cap) ?? false;
}

// ============================================================================
// Analytics snapshot (for dashboards / Brain Stage 10)
// ============================================================================

export function analyticsSnapshot(deals: { stage?: string | null; amount_cents?: number | null }[]) {
  const funnel = buildFunnel(deals);
  return {
    funnel,
    conversion: conversionRate(funnel),
    forecast_cents: forecastRevenueCents(deals),
    pipeline_value_cents: funnel.reduce((a, b) => a + b.value_cents, 0),
    total_deals: deals.length,
    at: new Date().toISOString(),
  };
}
