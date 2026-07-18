/**
 * HAPPY X — R27 HAPPY Brain runtime.
 *
 * Central AI orchestration engine. Every AI feature routes through here.
 * Brain never manipulates business data directly — it executes strictly
 * through existing runtimes (revenue, crm, erp, finance, wms, mfg,
 * marketplace, builder, deployment, analytics, digital-human).
 *
 * Every step is auditable via brain_sessions / brain_intents / brain_plans
 * / brain_decisions / brain_tool_calls. FACT and AI RECOMMENDATION are
 * stored in separate JSON columns.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import * as bi from "../bi/engine";
import * as fin from "../finance/engine";
import * as wms from "../wms/engine";
import * as mfg from "../mfg/engine";

type SB = SupabaseClient<any, any, any>;
function unwrap<T>(res: { data: T | null; error: any }): T {
  if (res.error) throw res.error; return res.data as T;
}
function num(n: unknown, d = 0): number { const v = Number(n); return Number.isFinite(v) ? v : d; }

/* ---------------- Intent classification (rule-based, deterministic) --------- */

export type Runtime =
  | "revenue" | "finance" | "crm" | "erp" | "wms" | "mfg"
  | "marketplace" | "builder" | "deployment" | "analytics"
  | "digital_human" | "notifications" | "support" | "brain";

export type IntentKind =
  | "business" | "finance" | "sales" | "crm" | "erp" | "builder"
  | "marketplace" | "analytics" | "support" | "conversation" | "unknown";

export interface IntentGuess {
  intent: IntentKind;
  action?: string;
  entity_type?: string;
  runtime: Runtime;
  confidence: number;
  reasoning: string;
  alternatives: Array<{ intent: IntentKind; runtime: Runtime; confidence: number }>;
}

const RULES: Array<{
  keywords: RegExp; intent: IntentKind; runtime: Runtime; action?: string;
  entity_type?: string; base: number;
}> = [
  { keywords: /\b(revenue|mrr|arr|sales performance|top customers)\b/i, intent: "analytics", runtime: "analytics", action: "revenue_summary", base: 0.9 },
  { keywords: /\b(forecast|predict|projection)\b/i, intent: "analytics", runtime: "analytics", action: "forecast", base: 0.85 },
  { keywords: /\b(invoice|billing|receivable|ar aging)\b/i, intent: "finance", runtime: "finance", action: "list_invoices", entity_type: "invoice", base: 0.88 },
  { keywords: /\b(vendor bill|payable|ap)\b/i, intent: "finance", runtime: "finance", action: "list_vendor_bills", entity_type: "vendor_bill", base: 0.85 },
  { keywords: /\b(profit|p&l|balance sheet|trial balance|cash flow|gst)\b/i, intent: "finance", runtime: "finance", action: "financial_report", base: 0.88 },
  { keywords: /\b(deal|pipeline|lead|opportunit|customer 360)\b/i, intent: "crm", runtime: "crm", action: "crm_summary", base: 0.86 },
  { keywords: /\b(purchase order|po|supplier|goods receipt|approval)\b/i, intent: "erp", runtime: "erp", action: "erp_operations", base: 0.82 },
  { keywords: /\b(production|batch|bom|quality|machine|downtime|maintenance)\b/i, intent: "business", runtime: "mfg", action: "mfg_summary", base: 0.86 },
  { keywords: /\b(inventory|stock|warehouse|reserv|transfer|cycle count|near expiry)\b/i, intent: "business", runtime: "wms", action: "wms_summary", base: 0.86 },
  { keywords: /\b(listing|marketplace|creator|download|purchase|top listing)\b/i, intent: "marketplace", runtime: "marketplace", action: "marketplace_summary", base: 0.86 },
  { keywords: /\b(deploy|deployment|domain|release|rollback|build)\b/i, intent: "builder", runtime: "deployment", action: "deployment_summary", base: 0.84 },
  { keywords: /\b(website|landing page|generate site|publish site)\b/i, intent: "builder", runtime: "builder", action: "generate_website", base: 0.82 },
  { keywords: /\b(app|mobile|screen|generate app)\b/i, intent: "builder", runtime: "builder", action: "generate_app", base: 0.78 },
  { keywords: /\b(notify|send email|reminder|alert)\b/i, intent: "business", runtime: "notifications", action: "send_notification", base: 0.78 },
  { keywords: /\b(founder|overview|health|dashboard)\b/i, intent: "analytics", runtime: "analytics", action: "founder_overview", base: 0.9 },
  { keywords: /\b(help|support|how do i|ticket)\b/i, intent: "support", runtime: "support", action: "assist", base: 0.7 },
];

export const intent = {
  classify(input: string, context: Record<string, unknown> = {}): IntentGuess {
    const text = (input ?? "").trim();
    const hits = RULES
      .map((r) => ({ r, m: r.keywords.test(text) }))
      .filter((x) => x.m)
      .map((x) => ({
        intent: x.r.intent, runtime: x.r.runtime,
        action: x.r.action, entity_type: x.r.entity_type,
        confidence: Math.min(0.99, x.r.base + ((context.module as string) === x.r.runtime ? 0.05 : 0)),
      }));
    if (hits.length === 0) {
      const founder = (context.founder_mode as boolean) ?? false;
      return {
        intent: text ? "conversation" : "unknown",
        runtime: founder ? "analytics" : "brain",
        confidence: text ? 0.4 : 0.1,
        reasoning: text
          ? "No runtime keyword matched — routed to conversational reply."
          : "Empty input.",
        alternatives: [],
      };
    }
    hits.sort((a, b) => b.confidence - a.confidence);
    const top = hits[0];
    return {
      intent: top.intent, action: top.action, entity_type: top.entity_type,
      runtime: top.runtime, confidence: top.confidence,
      reasoning: `Matched keyword rule for ${top.runtime}.${top.action ?? ""}`.trim(),
      alternatives: hits.slice(1, 4).map((h) => ({ intent: h.intent, runtime: h.runtime, confidence: h.confidence })),
    };
  },
};

/* ---------------- Context snapshot ---------------------------------------- */

export const contextEngine = {
  async snapshot(sb: SB, userId: string, company_id: string, extra: Record<string, unknown> = {}) {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      sb.from("profiles").select("id, full_name, avatar_url").eq("id", userId).maybeSingle(),
      sb.from("role_assignments").select("scope_type, scope_id, role_id").eq("user_id", userId),
    ]);
    return {
      user: { id: userId, ...(profile ?? {}) },
      company_id,
      permissions: { role_assignments: roles ?? [] },
      captured_at: new Date().toISOString(),
      ...extra,
    };
  },
};

/* ---------------- Session / plan / decision persistence -------------------- */

export const sessions = {
  async open(sb: SB, params: {
    company_id: string; user_id: string;
    source: "voice"|"chat"|"palette"|"api"|"digital_human"|"automation"|"founder"|"job";
    input?: string; channel?: string; workspace_id?: string;
    founder_mode?: boolean; context?: Record<string, unknown>;
  }) {
    const res = await sb.from("brain_sessions").insert({
      company_id: params.company_id, user_id: params.user_id,
      workspace_id: params.workspace_id ?? null,
      source: params.source, channel: params.channel ?? null,
      input: params.input ?? null,
      founder_mode: !!params.founder_mode,
      context: params.context ?? {},
      status: "open",
    }).select().single();
    return unwrap(res);
  },
  async complete(sb: SB, id: string, summary: string, status: "completed"|"failed"|"cancelled" = "completed") {
    const res = await sb.from("brain_sessions").update({
      status, summary, completed_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    return unwrap(res);
  },
  async list(sb: SB, company_id: string, limit = 50) {
    return unwrap(await sb.from("brain_sessions").select("*")
      .eq("company_id", company_id).order("started_at", { ascending: false }).limit(limit)) as any[];
  },
};

/* ---------------- Planning engine ----------------------------------------- */

export interface PlanStep {
  step: number; runtime: Runtime; tool: string;
  args?: Record<string, unknown>; requires_confirmation?: boolean;
  description: string;
}

export interface BrainPlan {
  goal: string; steps: PlanStep[]; risks: string[]; dependencies: string[];
  alternatives: string[]; requires_confirmation: boolean;
}

export const planner = {
  build(intent: IntentGuess, company_id: string): BrainPlan {
    const steps: PlanStep[] = [];
    const risks: string[] = [];
    const deps: string[] = [];
    let requiresConfirm = false;

    switch (intent.action) {
      case "revenue_summary":
        steps.push({ step: 1, runtime: "analytics", tool: "revenue.summary", args: { company_id }, description: "Aggregate revenue KPIs from live invoices/subscriptions." });
        break;
      case "forecast":
        steps.push({ step: 1, runtime: "analytics", tool: "revenue.series", args: { company_id, grain: "month", periods: 12 }, description: "Load 12-month history." });
        steps.push({ step: 2, runtime: "analytics", tool: "forecast.revenue", args: { company_id, horizon_months: 6 }, description: "Compute 6-month forecast from real history." });
        break;
      case "list_invoices":
        steps.push({ step: 1, runtime: "finance", tool: "finance.summary", args: { company_id }, description: "Fetch AR summary." });
        break;
      case "list_vendor_bills":
        steps.push({ step: 1, runtime: "finance", tool: "finance.summary", args: { company_id }, description: "Fetch AP summary." });
        break;
      case "financial_report":
        steps.push({ step: 1, runtime: "finance", tool: "finance.summary", args: { company_id }, description: "Fetch consolidated finance summary." });
        break;
      case "crm_summary":
        steps.push({ step: 1, runtime: "crm", tool: "customers.summary", args: { company_id }, description: "Aggregate CRM funnel from live deals/leads." });
        break;
      case "erp_operations":
        steps.push({ step: 1, runtime: "erp", tool: "wms.summary", args: { company_id }, description: "Load WMS state for ERP context." });
        break;
      case "mfg_summary":
        steps.push({ step: 1, runtime: "mfg", tool: "mfg.summary", args: { company_id }, description: "Aggregate production/quality/machine KPIs." });
        break;
      case "wms_summary":
        steps.push({ step: 1, runtime: "wms", tool: "wms.summary", args: { company_id }, description: "Aggregate stock/lot/threshold KPIs." });
        break;
      case "marketplace_summary":
        steps.push({ step: 1, runtime: "marketplace", tool: "marketplace.summary", args: { company_id }, description: "Aggregate listings/purchases/reviews." });
        break;
      case "deployment_summary":
        steps.push({ step: 1, runtime: "deployment", tool: "builder.summary", args: { company_id }, description: "Aggregate deployment KPIs." });
        break;
      case "founder_overview":
        steps.push({ step: 1, runtime: "analytics", tool: "founder.overview", args: { company_id }, description: "Compose founder health score from all runtimes." });
        steps.push({ step: 2, runtime: "analytics", tool: "insights.generateFounder", args: { company_id }, description: "Generate FACT vs RECOMMENDATION insight." });
        break;
      case "generate_website":
      case "generate_app":
        risks.push("Deployment side-effects. Requires explicit confirmation.");
        deps.push("builder runtime available");
        requiresConfirm = true;
        steps.push({ step: 1, runtime: "builder", tool: "builder.generate_structure", args: {}, description: "Generate structure (pending human confirmation).", requires_confirmation: true });
        break;
      case "send_notification":
        risks.push("Notifications reach real users. Confirm audience before send.");
        requiresConfirm = true;
        steps.push({ step: 1, runtime: "notifications", tool: "notifications.dispatch", args: {}, description: "Route to Notifications runtime (pending confirmation).", requires_confirmation: true });
        break;
      case "assist":
      default:
        steps.push({ step: 1, runtime: "brain", tool: "brain.reply", description: "Reply conversationally without runtime side-effects." });
    }

    return {
      goal: `${intent.intent}/${intent.action ?? "converse"}`,
      steps, risks, dependencies: deps,
      alternatives: intent.alternatives.map((a) => `${a.runtime}.${a.intent} (${a.confidence.toFixed(2)})`),
      requires_confirmation: requiresConfirm,
    };
  },

  async persist(sb: SB, session_id: string, company_id: string, intent_id: string,
    p: BrainPlan) {
    const res = await sb.from("brain_plans").insert({
      session_id, intent_id, company_id,
      goal: p.goal, steps: p.steps, risks: p.risks,
      dependencies: p.dependencies, alternatives: p.alternatives,
      requires_confirmation: p.requires_confirmation,
      status: "draft",
    }).select().single();
    return unwrap(res);
  },
};

/* ---------------- Tool gateway (routes ONLY through existing runtimes) ----- */

export const gateway = {
  async invoke(sb: SB, ctx: { company_id: string; session_id: string; user_id: string; plan_id?: string },
               runtime: Runtime, tool: string, args: Record<string, unknown> = {}) {
    const started = Date.now();
    let status: "succeeded"|"failed" = "succeeded";
    let facts: Record<string, unknown> = {};
    let err: string | undefined;
    try {
      switch (`${runtime}.${tool}`) {
        case "analytics.revenue.summary":       facts = await bi.revenue.summary(sb, ctx.company_id); break;
        case "analytics.revenue.series":        facts = { series: await bi.revenue.series(sb, ctx.company_id, (args.grain as any) ?? "month", num(args.periods, 12)) }; break;
        case "analytics.customers.summary":     facts = await bi.customers.summary(sb, ctx.company_id); break;
        case "analytics.marketplace.summary":   facts = await bi.marketplace.summary(sb, ctx.company_id); break;
        case "analytics.builder.summary":       facts = await bi.builder.summary(sb, ctx.company_id); break;
        case "analytics.system.summary":        facts = await bi.system.summary(sb, ctx.company_id); break;
        case "analytics.founder.overview":      facts = await bi.founder.overview(sb, ctx.company_id); break;
        case "analytics.forecast.revenue":      facts = await bi.forecast.revenueForecast(sb, ctx.company_id, ctx.user_id, num(args.horizon_months, 6)); break;
        case "analytics.insights.generateFounder": facts = await bi.insights.generateFounder(sb, ctx.company_id); break;
        case "analytics.alerts.evaluate":       facts = await bi.alerts.evaluate(sb, ctx.company_id); break;
        case "analytics.search":                facts = await bi.search.run(sb, ctx.company_id, String(args.term ?? ""), num(args.limit, 20)); break;

        case "finance.finance.summary":         facts = await bi.finance.summary(sb, ctx.company_id); break;
        case "finance.reports.trial_balance":   facts = await (fin.reports as any).trialBalance(sb, ctx.company_id); break;
        case "finance.reports.profit_and_loss": facts = await (fin.reports as any).profitAndLoss(sb, ctx.company_id); break;
        case "finance.reports.balance_sheet":   facts = await (fin.reports as any).balanceSheet(sb, ctx.company_id); break;

        case "wms.wms.summary":                 facts = await bi.warehouse.summary(sb, ctx.company_id); break;
        case "wms.analytics.overview":          facts = await (wms as any).wmsAnalyticsOverview?.(sb, ctx.company_id) ?? await bi.warehouse.summary(sb, ctx.company_id); break;
        case "mfg.mfg.summary":                 facts = await bi.manufacturing.summary(sb, ctx.company_id); break;
        case "mfg.dashboard.overview":          facts = await (mfg as any).mfgDashboard?.(sb, ctx.company_id) ?? await bi.manufacturing.summary(sb, ctx.company_id); break;

        case "crm.customers.summary":           facts = await bi.customers.summary(sb, ctx.company_id); break;
        case "erp.wms.summary":                 facts = await bi.warehouse.summary(sb, ctx.company_id); break;

        case "marketplace.marketplace.summary": facts = await bi.marketplace.summary(sb, ctx.company_id); break;
        case "deployment.builder.summary":      facts = await bi.builder.summary(sb, ctx.company_id); break;

        case "brain.brain.reply":
          facts = { reply: "HAPPY Brain acknowledges. No runtime action taken.", conversational: true };
          break;

        default:
          throw new Error(`No gateway route for ${runtime}.${tool}`);
      }
    } catch (e: any) {
      status = "failed"; err = String(e?.message ?? e); facts = {};
    }
    const row = await sb.from("brain_tool_calls").insert({
      session_id: ctx.session_id, plan_id: ctx.plan_id ?? null,
      company_id: ctx.company_id, user_id: ctx.user_id,
      runtime, tool, args, status, error: err,
      result_facts: facts,
      ai_recommendation: {},  // populated by reasoning engine after fact collection
      duration_ms: Date.now() - started,
      requires_confirmation: false,
    }).select().single();
    return unwrap(row);
  },
};

/* ---------------- Reasoning engine (FACT vs RECOMMENDATION) --------------- */

export const reasoning = {
  reason(runtime: Runtime, tool: string, facts: Record<string, any>): {
    why: string; what: string; next: string[]; risks: string[];
    recommendations: Array<{ title: string; rationale: string; priority: "low"|"medium"|"high" }>;
  } {
    const recs: Array<{ title: string; rationale: string; priority: "low"|"medium"|"high" }> = [];
    let why = `Executed ${runtime}.${tool} against live database rows.`;
    let what = "Facts represent real KPIs computed at query time.";
    const next: string[] = [];
    const risks: string[] = [];

    if (facts.growth_pct != null && facts.growth_pct < 0) {
      recs.push({ title: "Revenue contraction", rationale: `Growth ${facts.growth_pct.toFixed(2)}% MoM.`, priority: "high" });
      next.push("Review CRM funnel and expiring subscriptions.");
    }
    if (facts.overdue_invoices > 0) {
      recs.push({ title: `${facts.overdue_invoices} overdue invoices`, rationale: "Trigger AR reminders from Finance runtime.", priority: "medium" });
    }
    if (facts.cash_balance != null && facts.payables != null && facts.cash_balance < facts.payables) {
      recs.push({ title: "Cash below payables", rationale: "Prioritize AR collection or defer vendor payments.", priority: "high" });
    }
    if (facts.expired_lots > 0 || facts.near_expiry_lots > 0) {
      recs.push({ title: "Inventory expiry pressure", rationale: `${facts.expired_lots ?? 0} expired, ${facts.near_expiry_lots ?? 0} near expiry.`, priority: "medium" });
    }
    if (facts.quality_pass_rate_pct != null && facts.quality_pass_rate_pct < 90) {
      recs.push({ title: "Quality below 90%", rationale: "Audit failing batches; check SOP compliance.", priority: "medium" });
    }
    if (facts.business_health_score != null && facts.business_health_score < 60) {
      risks.push(`Business health score at ${facts.business_health_score}.`);
    }
    if (recs.length === 0) {
      recs.push({ title: "No anomalies detected", rationale: "All measured KPIs within healthy bounds.", priority: "low" });
    }
    return { why, what, next, risks, recommendations: recs };
  },
};

/* ---------------- Safety engine ------------------------------------------- */

export const safety = {
  async check(sb: SB, userId: string, company_id: string, runtime: Runtime, tool: string): Promise<{
    allowed: boolean; reason?: string;
  }> {
    // Company isolation — must be a company member.
    const { data: m } = await sb.rpc("is_company_member", { _user_id: userId, _company_id: company_id });
    if (!m) return { allowed: false, reason: "Not a member of this company." };
    // Destructive tools are blocked here — R27 gateway is read-only.
    if (/^(builder|deployment|notifications)\./.test(`${runtime}.${tool}`)) {
      return { allowed: false, reason: "Destructive action requires human confirmation via UI flow." };
    }
    return { allowed: true };
  },
};

/* ---------------- Decision engine ----------------------------------------- */

export const decision = {
  async recordRuntime(sb: SB, session_id: string, company_id: string,
                      chosen: string, candidates: any[], facts: any[], recommendation: any, rationale: string) {
    const res = await sb.from("brain_decisions").insert({
      session_id, company_id, decision_type: "runtime",
      chosen, candidates, facts, recommendation, rationale,
    }).select().single();
    return unwrap(res);
  },
};

/* ---------------- Orchestrator (end-to-end) -------------------------------- */

export const orchestrator = {
  async run(sb: SB, params: {
    userId: string; company_id: string; workspace_id?: string;
    input: string; source: "voice"|"chat"|"palette"|"api"|"digital_human"|"automation"|"founder"|"job";
    channel?: string; founder_mode?: boolean; module?: string;
  }) {
    // 1. context snapshot
    const ctx = await contextEngine.snapshot(sb, params.userId, params.company_id, {
      module: params.module, source: params.source, founder_mode: !!params.founder_mode,
    });

    // 2. session
    const session = await sessions.open(sb, {
      company_id: params.company_id, user_id: params.userId,
      workspace_id: params.workspace_id, source: params.source,
      input: params.input, channel: params.channel,
      founder_mode: params.founder_mode, context: ctx,
    });

    // 3. intent classification
    const guess = intent.classify(params.input, { module: params.module, founder_mode: params.founder_mode });
    const intentRow: any = unwrap(await sb.from("brain_intents").insert({
      session_id: session.id, company_id: params.company_id,
      intent: guess.intent, action: guess.action, entity_type: guess.entity_type,
      confidence: guess.confidence, alternatives: guess.alternatives,
      chosen_runtime: guess.runtime, reasoning: guess.reasoning,
    }).select().single());

    // 4. decision (runtime choice)
    await decision.recordRuntime(sb, session.id, params.company_id, guess.runtime,
      guess.alternatives, [{ input_length: params.input.length, module: params.module ?? null }],
      { intent: guess.intent, action: guess.action },
      `Chose ${guess.runtime} (${(guess.confidence * 100).toFixed(0)}% confidence): ${guess.reasoning}`);

    // 5. plan
    const plan = planner.build(guess, params.company_id);
    const planRow = await planner.persist(sb, session.id, params.company_id, intentRow.id, plan);

    // 6. execute non-destructive steps
    const executed: any[] = [];
    for (const step of plan.steps) {
      if (step.requires_confirmation) {
        executed.push({ step: step.step, deferred: true, reason: "requires human confirmation" });
        continue;
      }
      const safeCheck = await safety.check(sb, params.userId, params.company_id, step.runtime, step.tool);
      if (!safeCheck.allowed) {
        executed.push({ step: step.step, denied: true, reason: safeCheck.reason });
        continue;
      }
      const call = await gateway.invoke(sb, {
        company_id: params.company_id, session_id: session.id,
        user_id: params.userId, plan_id: planRow.id,
      }, step.runtime, step.tool, step.args ?? {});
      executed.push(call);
    }

    // 7. reasoning summary
    const primaryFacts = (executed.find((e: any) => e?.result_facts && !e?.deferred && !e?.denied)?.result_facts) ?? {};
    const primary = executed.find((e: any) => e?.runtime && !e?.deferred && !e?.denied);
    const reason = primary
      ? reasoning.reason(primary.runtime, primary.tool, primaryFacts)
      : { why: "No runtime executed.", what: "Conversational or deferred.", next: [], risks: [], recommendations: [] };

    // 8. update plan + session status
    await sb.from("brain_plans").update({
      status: plan.requires_confirmation ? "draft" : "completed",
    }).eq("id", planRow.id);
    await sessions.complete(sb, session.id,
      `Intent ${guess.intent}/${guess.action ?? "-"} — ${executed.length} step(s), ${reason.recommendations.length} recommendation(s).`,
      "completed");

    return {
      session_id: session.id,
      intent: { ...guess, id: intentRow.id },
      plan: planRow,
      executed,
      facts: primaryFacts,
      recommendations: reason.recommendations,
      reasoning: { why: reason.why, what: reason.what, next: reason.next, risks: reason.risks },
    };
  },
};

/* ---------------- R115.b Canonical runBrain() pipeline --------------------
 * LISTEN → UNDERSTAND → MIRROR → LOAD MEMORY → LOAD KNOWLEDGE →
 * LOAD WORKSPACE → REASON → PLAN → SELECT AGENTS → RESPOND →
 * DIGITAL HUMAN → SAVE MEMORY → LEARN.
 *
 * Composes existing owners — never duplicates:
 *   • intent / planner / gateway / reasoning / orchestrator (this file)
 *   • memoryContext / memoryStore / memoryLogEvent  (src/lib/memory/engine)
 *   • naturalQuery                                  (src/lib/kg/engine)
 * ------------------------------------------------------------------------ */
import { memoryContext, memoryStore, memoryLogEvent } from "../memory/engine";
import { naturalQuery as kgNaturalQuery } from "../kg/engine";

export type DigitalHumanEnvelope = {
  text: string;
  emotion: "neutral" | "warm" | "focused" | "concerned" | "celebratory";
  gesture: "idle" | "point" | "wave" | "nod" | "explain" | "celebrate";
  eyeContact: boolean;
  whiteboard?: { op: "clear" | "write" | "highlight"; content?: string }[];
};

export interface RunBrainInput {
  company_id: string;
  input: string;
  source: "voice" | "chat" | "palette" | "api" | "digital_human" | "automation" | "founder" | "job";
  workspace_id?: string;
  channel?: string;
  module?: string;
  founder_mode?: boolean;
  persona?: "founder" | "admin" | "employee" | "customer" | "guest";
}

export const brainPipeline = {
  /** Stage 3 — MIRROR: reflect back the user's framing in one sentence. */
  mirror(input: string, persona: RunBrainInput["persona"] = "guest") {
    const trimmed = input.trim().replace(/\s+/g, " ");
    const opener =
      persona === "founder" ? "Founder — hearing you say:"
      : persona === "customer" ? "Got it:"
      : "Understood:";
    return `${opener} "${trimmed.slice(0, 240)}${trimmed.length > 240 ? "…" : ""}"`;
  },

  /** Stage 9 — SELECT AGENTS from the intent's chosen runtime. */
  selectAgents(guess: IntentGuess): string[] {
    const map: Partial<Record<Runtime, string[]>> = {
      revenue: ["revenue-analyst"],
      finance: ["finance-analyst"],
      crm: ["crm-agent"],
      erp: ["erp-agent"],
      wms: ["wms-agent"],
      mfg: ["mfg-agent"],
      marketplace: ["marketplace-agent"],
      builder: ["builder-agent"],
      deployment: ["deployment-agent"],
      analytics: ["analytics-agent"],
      digital_human: ["dh-presenter"],
      notifications: ["notifier"],
      support: ["support-agent"],
      brain: ["router"],
    };
    return map[guess.runtime] ?? ["router"];
  },

  /** Stage 11 — DIGITAL HUMAN envelope shaping. */
  toDigitalHuman(reply: string, kind: "answer" | "confirm" | "warn" | "celebrate" = "answer"): DigitalHumanEnvelope {
    const preset: Record<string, Pick<DigitalHumanEnvelope, "emotion" | "gesture">> = {
      answer: { emotion: "warm", gesture: "explain" },
      confirm: { emotion: "focused", gesture: "nod" },
      warn: { emotion: "concerned", gesture: "point" },
      celebrate: { emotion: "celebratory", gesture: "celebrate" },
    };
    return { text: reply, eyeContact: true, ...preset[kind] };
  },
};

/**
 * runBrain — canonical HAPPY Brain entrypoint (R115.b).
 * All brain callers should route through here. Do NOT add a second runBrain.
 */
export async function runBrain(sb: SB, userId: string, input: RunBrainInput) {
  // 1 LISTEN — take raw input.
  const listen = { input: input.input, source: input.source, at: new Date().toISOString() };

  // 2 UNDERSTAND — classify intent.
  const guess = intent.classify(input.input, { module: input.module, founder_mode: input.founder_mode });

  // 3 MIRROR — reflect framing.
  const mirror = brainPipeline.mirror(input.input, input.persona);

  // 4 LOAD MEMORY — recent context memory.
  const memory = await memoryContext(sb, userId, {
    company_id: input.company_id, workspace_id: input.workspace_id ?? null, limit: 20,
  }).catch(() => ({ items: [] as any[] }));

  // 5 LOAD KNOWLEDGE — best-effort KG lookup.
  const knowledge = await kgNaturalQuery(sb, userId, { company_id: input.company_id, q: input.input })
    .catch(() => ({ entities: [], relations: [], summary: "" } as any));

  // 6 LOAD WORKSPACE — brain context snapshot (module/source/founder flags).
  const workspace = await contextEngine.snapshot(sb, userId, input.company_id, {
    module: input.module, source: input.source, founder_mode: !!input.founder_mode,
  });

  // 7-8 REASON + PLAN + execute — reuse orchestrator (single source of truth).
  const orch = await orchestrator.run(sb, {
    userId, company_id: input.company_id, workspace_id: input.workspace_id,
    input: input.input, source: input.source, channel: input.channel,
    founder_mode: input.founder_mode, module: input.module,
  });

  // 9 SELECT AGENTS.
  const agents = brainPipeline.selectAgents(guess);

  // 10 RESPOND — text summary from reasoning.
  const reply =
    orch.reasoning?.what?.trim()
    || orch.recommendations?.[0]
    || "Acknowledged. No action was executed for this request.";

  // 11 DIGITAL HUMAN envelope.
  const digitalHuman = brainPipeline.toDigitalHuman(
    reply,
    (orch.executed ?? []).some((e: any) => e?.denied) ? "warn" : "answer",
  );

  // 12 SAVE MEMORY — persist the interaction (best-effort, RLS-scoped).
  await memoryStore(sb, userId, {
    company_id: input.company_id,
    workspace_id: input.workspace_id ?? null,
    kind: "conversation",
    scope: "personal",
    title: `Brain: ${guess.intent}${guess.action ? "/" + guess.action : ""}`,
    body: `${mirror}\n\n${reply}`,
    metadata: { session_id: orch.session_id, agents, source: input.source },
  } as any).catch(() => null);

  // 13 LEARN — append event for feedback loop.
  await memoryLogEvent(sb, userId, {
    company_id: input.company_id,
    workspace_id: input.workspace_id ?? null,
    event_type: "brain.run",
    payload: {
      intent: guess.intent, runtime: guess.runtime, confidence: guess.confidence,
      steps: (orch.executed ?? []).length, session_id: orch.session_id,
    },
  } as any).catch(() => null);

  return {
    listen, understand: guess, mirror,
    memory, knowledge, workspace,
    plan: orch.plan, executed: orch.executed,
    facts: orch.facts, recommendations: orch.recommendations, reasoning: orch.reasoning,
    agents, reply, digitalHuman, session_id: orch.session_id,
  };
}
