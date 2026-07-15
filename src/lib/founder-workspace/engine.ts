/**
 * R38 — Founder Copilot Workspace Runtime (server-only, orchestration).
 *
 * REUSES (never duplicates):
 *   - audit_logs (executive timeline)
 *   - approvals, approval_delegations (approval center)
 *   - notifications (action center)
 *   - bi_report_runs, bi_insights, bi_alert_events (analytics center)
 *   - obs_status_components, obs_status_updates, incidents (observability)
 *   - bkp_jobs, ha_events (backup/HA health)
 *   - project_deployments, project_deployment_events (deployments)
 *   - marketplace_transactions, wallets, credit_ledger_entries (revenue/wallet)
 *   - invoices, expenses, journal_entries (finance)
 *   - customers, deals, leads (CRM)
 *   - production_orders, machines (manufacturing)
 *   - warehouses, inventory_lots (warehouse)
 *   - listings, plugins, project_deployments (marketplace/builder/deploy)
 *   - agent_registry, agent_tasks, agent_metrics_daily (AI)
 *   - auto_workflows, auto_runs (automation)
 *
 * Adds only workspace state:
 *   - founder_workspace_prefs   (personalization)
 *   - founder_command_history   (immutable command audit)
 *   - founder_briefings         (fact snapshot cache)
 *   - founder_recommendations   (fact vs AI, kept separate)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

/* ------------------------------ types ------------------------------- */

export type WorkspacePrefs = {
  pinned_modules?: string[];
  favorite_dashboards?: string[];
  recent_projects?: string[];
  saved_views?: Json;
  theme?: "light" | "dark" | "system";
  language?: string;
  accessibility?: Json;
};

export type CommandInput = {
  command_text: string;
  input_mode?: "text" | "voice" | "shortcut";
  company_id?: string | null;
};

export type BriefingPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "annual";

export type FactRecommendation = {
  company_id?: string | null;
  category: string;
  title: string;
  body?: string;
  evidence: Json;
  source_runtime: string;
  expires_at?: string | null;
};

export type AiRecommendation = FactRecommendation & {
  confidence: number; // 0..1
};

/* ------------------------------ helpers ------------------------------ */

async function ensureFounderOrAdmin(sb: SB, userId: string, companyId?: string | null) {
  const { data: isFounder } = await sb.rpc("is_platform_founder", { _user_id: userId });
  if (isFounder) return;
  if (companyId) {
    const { data: isAdmin } = await sb.rpc("is_company_admin", {
      _user_id: userId, _company_id: companyId,
    });
    if (isAdmin) return;
  }
  throw new Error("Forbidden: founder or company admin required");
}

/* ============================ Personalization ======================== */

export async function getPrefs(sb: SB, userId: string) {
  const { data, error } = await sb
    .from("founder_workspace_prefs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? {
    user_id: userId,
    pinned_modules: [],
    favorite_dashboards: [],
    recent_projects: [],
    saved_views: [],
    theme: "system",
    language: "en",
    accessibility: {},
    updated_at: new Date().toISOString(),
  };
}

export async function upsertPrefs(sb: SB, userId: string, input: WorkspacePrefs) {
  const row = {
    user_id: userId,
    pinned_modules: input.pinned_modules ?? [],
    favorite_dashboards: input.favorite_dashboards ?? [],
    recent_projects: (input.recent_projects ?? []) as unknown as string[],
    saved_views: (input.saved_views ?? []) as Json,
    theme: input.theme ?? "system",
    language: input.language ?? "en",
    accessibility: (input.accessibility ?? {}) as Json,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb
    .from("founder_workspace_prefs")
    .upsert(row, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ============================ Command Router ========================= */

/**
 * Deterministic keyword-based intent classifier. Zero ML: this is a
 * dispatcher only. AI-based intent classification lives in the Brain
 * Runtime and is called through the response layer separately.
 */
export function classifyIntent(command: string): {
  intent: string; capability: string; target_runtime: string;
} {
  const c = command.toLowerCase().trim();
  const rules: Array<[RegExp, string, string, string]> = [
    [/\brevenue|sales today|mrr|arr\b/, "show_revenue", "read.revenue", "revenue"],
    [/\bcrm|lead|deal|pipeline|customer\b/, "open_crm", "read.crm", "crm"],
    [/\bpending approval|approve|approvals?\b/, "list_approvals", "read.approvals", "approvals"],
    [/\bdeploy|publish|deployment\b/, "deploy", "write.deploy", "deployment"],
    [/\blow inventory|stock|warehouse\b/, "warehouse_status", "read.warehouse", "warehouse"],
    [/\bfounder report|briefing|daily report\b/, "generate_briefing", "write.briefing", "founder_workspace"],
    [/\bmarketplace|listing\b/, "open_marketplace", "read.marketplace", "marketplace"],
    [/\bfinance|invoice|expense|journal\b/, "open_finance", "read.finance", "finance"],
    [/\binvestor|presentation|pitch\b/, "open_presentation", "read.presentation", "presentation"],
    [/\bautomation|workflow\b/, "open_automation", "read.automation", "automation"],
    [/\bincident|outage|alert\b/, "open_incidents", "read.observability", "observability"],
    [/\bbackup|restore|disaster\b/, "open_backup", "read.backup", "backup"],
    [/\bagent|ai employee|happy\b/, "open_ai", "read.ai", "ai"],
    [/\bsecurity|audit|rls\b/, "open_security", "read.security", "security"],
  ];
  for (const [re, intent, capability, runtime] of rules) {
    if (re.test(c)) return { intent, capability, target_runtime: runtime };
  }
  return { intent: "ambiguous", capability: "unknown", target_runtime: "unresolved" };
}

export async function dispatchCommand(
  sb: SB, userId: string, input: CommandInput,
): Promise<{
  id: string; intent: string; capability: string; target_runtime: string;
  status: "dispatched" | "ambiguous"; suggestion?: string;
}> {
  const started = Date.now();
  const { intent, capability, target_runtime } = classifyIntent(input.command_text);
  const status: "dispatched" | "ambiguous" =
    intent === "ambiguous" ? "ambiguous" : "dispatched";

  const { data, error } = await sb
    .from("founder_command_history")
    .insert({
      user_id: userId,
      company_id: input.company_id ?? null,
      command_text: input.command_text,
      input_mode: input.input_mode ?? "text",
      intent, capability, target_runtime, status,
      latency_ms: Date.now() - started,
      response: { dispatched_at: new Date().toISOString() } as Json,
    })
    .select("id")
    .single();
  if (error) throw error;

  return {
    id: data.id, intent, capability, target_runtime, status,
    suggestion: status === "ambiguous"
      ? "Command not recognized. Try: 'show revenue', 'pending approvals', 'deploy website'."
      : undefined,
  };
}

export async function commandHistory(sb: SB, userId: string, limit = 50) {
  const { data, error } = await sb
    .from("founder_command_history")
    .select("id, command_text, intent, target_runtime, status, created_at, latency_ms")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.min(200, Math.max(1, limit)));
  if (error) throw error;
  return data ?? [];
}

/* ============================ Executive Timeline ===================== */

export async function timeline(
  sb: SB, userId: string, opts: { company_id?: string | null; limit?: number; category?: string },
) {
  await ensureFounderOrAdmin(sb, userId, opts.company_id ?? null);
  let q = sb
    .from("audit_logs")
    .select("id, category, action, entity_type, entity_id, severity, actor_id, company_id, created_at, metadata")
    .order("created_at", { ascending: false })
    .limit(Math.min(500, Math.max(1, opts.limit ?? 100)));
  if (opts.company_id) q = q.eq("company_id", opts.company_id);
  if (opts.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/* ============================ Action Center ========================== */

export async function actionCenter(sb: SB, userId: string, companyId?: string | null) {
  await ensureFounderOrAdmin(sb, userId, companyId ?? null);
  const scope = (q: ReturnType<typeof scopeIt>) => q;
  function scopeIt<T extends { eq: (col: string, val: unknown) => T }>(builder: T): T {
    return companyId ? builder.eq("company_id", companyId) : builder;
  }

  const [
    approvalsRes, incidentsRes, deploysRes, backupsRes, notifsRes,
  ] = await Promise.all([
    scope(sb.from("approvals").select("id, subject, status, created_at, requester_id, company_id, severity").eq("status", "pending")).limit(50),
    scope(sb.from("incidents").select("id, title, severity, status, created_at, company_id").in("status", ["open","investigating","identified"])).limit(50),
    scope(sb.from("project_deployments").select("id, project_id, status, created_at, company_id").in("status", ["pending","in_progress","review"])).limit(50),
    scope(sb.from("bkp_jobs").select("id, policy_id, status, started_at, company_id").in("status", ["failed","stalled"])).limit(50),
    sb.from("notifications").select("id, title, kind, created_at, read_at").eq("user_id", userId).is("read_at", null).order("created_at", { ascending: false }).limit(50),
  ]);

  return {
    approvals: approvalsRes.data ?? [],
    incidents: incidentsRes.data ?? [],
    deployments: deploysRes.data ?? [],
    backup_alerts: backupsRes.data ?? [],
    unread_notifications: notifsRes.data ?? [],
    generated_at: new Date().toISOString(),
  };
}

/* ============================ Approval Center ======================== */

export async function approvalDecision(
  sb: SB, userId: string,
  args: { approval_id: string; decision: "approve" | "reject"; note?: string },
) {
  // Reuses approvals runtime — this is a thin auditable wrapper only.
  const { data: appr, error: readErr } = await sb
    .from("approvals").select("id, status, company_id").eq("id", args.approval_id).single();
  if (readErr) throw readErr;
  if (appr.status !== "pending") throw new Error(`approval ${appr.id} is ${appr.status}`);
  await ensureFounderOrAdmin(sb, userId, appr.company_id);

  const nextStatus = args.decision === "approve" ? "approved" : "rejected";
  const { data, error } = await sb
    .from("approvals")
    .update({
      status: nextStatus,
      decided_by: userId,
      decided_at: new Date().toISOString(),
      decision_note: args.note ?? null,
    } as never)
    .eq("id", args.approval_id)
    .select()
    .single();
  if (error) throw error;

  await sb.rpc("write_audit", {
    _category: "approvals",
    _action: `approval.${args.decision}`,
    _entity_type: "approvals",
    _entity_id: args.approval_id,
    _company_id: appr.company_id,
    _severity: "info",
    _metadata: { via: "founder_workspace" } as Json,
  } as never);

  return data;
}

/* ============================ Founder Briefing ======================= */

/** Assembles a fact briefing from existing runtime tables. No AI here. */
export async function generateBriefing(
  sb: SB, userId: string, period: BriefingPeriod, companyId?: string | null,
) {
  await ensureFounderOrAdmin(sb, userId, companyId ?? null);
  const now = new Date();
  const start = new Date(now);
  switch (period) {
    case "daily": start.setDate(start.getDate() - 1); break;
    case "weekly": start.setDate(start.getDate() - 7); break;
    case "monthly": start.setMonth(start.getMonth() - 1); break;
    case "quarterly": start.setMonth(start.getMonth() - 3); break;
    case "annual": start.setFullYear(start.getFullYear() - 1); break;
  }
  const startIso = start.toISOString();
  const endIso = now.toISOString();

  const scoped = <T extends { gte: (c: string, v: string) => T; lte: (c: string, v: string) => T; eq: (c: string, v: string) => T }>(q: T) => {
    let x = q.gte("created_at", startIso).lte("created_at", endIso);
    if (companyId) x = x.eq("company_id", companyId);
    return x;
  };

  const [
    revenueRes, expensesRes, invoicesRes, dealsRes, customersRes,
    prodRes, incidentsRes, deploysRes, backupsRes, agentTasksRes, autoRunsRes,
  ] = await Promise.all([
    scoped(sb.from("marketplace_transactions").select("amount_cents, currency", { count: "exact" })),
    scoped(sb.from("expenses").select("amount_cents", { count: "exact" })),
    scoped(sb.from("invoices").select("id, total_cents, status", { count: "exact" })),
    scoped(sb.from("deals").select("id, stage, amount_cents", { count: "exact" })),
    scoped(sb.from("customers").select("id", { count: "exact", head: true })),
    scoped(sb.from("production_orders").select("id, status", { count: "exact" })),
    scoped(sb.from("incidents").select("id, severity", { count: "exact" })),
    scoped(sb.from("project_deployments").select("id, status", { count: "exact" })),
    scoped(sb.from("bkp_jobs").select("id, status", { count: "exact" })),
    scoped(sb.from("agent_tasks").select("id, status", { count: "exact" })),
    scoped(sb.from("auto_runs").select("id, status", { count: "exact" })),
  ]);

  const sum = (rows: Array<{ amount_cents?: number | null; total_cents?: number | null }> | null | undefined, key: "amount_cents" | "total_cents") =>
    (rows ?? []).reduce((a, r) => a + Number((r as Record<string, unknown>)[key] ?? 0), 0);

  const snapshot: Json = {
    revenue: {
      transaction_count: revenueRes.count ?? 0,
      amount_cents: sum(revenueRes.data as never, "amount_cents"),
    },
    expenses: {
      count: expensesRes.count ?? 0,
      amount_cents: sum(expensesRes.data as never, "amount_cents"),
    },
    invoices: { count: invoicesRes.count ?? 0, total_cents: sum(invoicesRes.data as never, "total_cents") },
    crm: { deals: dealsRes.count ?? 0, customers: customersRes.count ?? 0 },
    manufacturing: { production_orders: prodRes.count ?? 0 },
    incidents: { count: incidentsRes.count ?? 0 },
    deployments: { count: deploysRes.count ?? 0 },
    backups: { count: backupsRes.count ?? 0 },
    ai: { agent_tasks: agentTasksRes.count ?? 0 },
    automation: { runs: autoRunsRes.count ?? 0 },
  };

  const { data, error } = await sb
    .from("founder_briefings")
    .upsert({
      company_id: companyId ?? null,
      period,
      period_start: startIso,
      period_end: endIso,
      snapshot,
      source_runtimes: [
        "marketplace","finance","crm","manufacturing","observability",
        "deployment","backup","ai","automation",
      ],
      generated_by: userId,
    }, { onConflict: "company_id,period,period_start" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listBriefings(
  sb: SB, userId: string, opts: { period?: BriefingPeriod; company_id?: string | null; limit?: number },
) {
  await ensureFounderOrAdmin(sb, userId, opts.company_id ?? null);
  let q = sb.from("founder_briefings").select("*").order("generated_at", { ascending: false })
    .limit(Math.min(50, Math.max(1, opts.limit ?? 10)));
  if (opts.period) q = q.eq("period", opts.period);
  if (opts.company_id) q = q.eq("company_id", opts.company_id);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/* ============================ Recommendations ======================== */

export async function recordFactRecommendation(sb: SB, userId: string, rec: FactRecommendation) {
  await ensureFounderOrAdmin(sb, userId, rec.company_id ?? null);
  const { data, error } = await sb
    .from("founder_recommendations")
    .insert({
      company_id: rec.company_id ?? null,
      kind: "fact",
      category: rec.category,
      title: rec.title,
      body: rec.body ?? null,
      evidence: rec.evidence,
      confidence: null,
      source_runtime: rec.source_runtime,
      expires_at: rec.expires_at ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recordAiRecommendation(sb: SB, userId: string, rec: AiRecommendation) {
  await ensureFounderOrAdmin(sb, userId, rec.company_id ?? null);
  if (rec.confidence < 0 || rec.confidence > 1) throw new Error("confidence must be in [0,1]");
  const { data, error } = await sb
    .from("founder_recommendations")
    .insert({
      company_id: rec.company_id ?? null,
      kind: "ai",
      category: rec.category,
      title: rec.title,
      body: rec.body ?? null,
      evidence: rec.evidence,
      confidence: rec.confidence,
      source_runtime: rec.source_runtime,
      expires_at: rec.expires_at ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listRecommendations(
  sb: SB, userId: string,
  opts: { kind?: "fact" | "ai"; company_id?: string | null; status?: string; limit?: number },
) {
  await ensureFounderOrAdmin(sb, userId, opts.company_id ?? null);
  let q = sb.from("founder_recommendations").select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(200, Math.max(1, opts.limit ?? 50)));
  if (opts.kind) q = q.eq("kind", opts.kind);
  if (opts.company_id) q = q.eq("company_id", opts.company_id);
  if (opts.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateRecommendationStatus(
  sb: SB, userId: string,
  args: { id: string; status: "acknowledged" | "dismissed" | "actioned" | "expired" },
) {
  const { data: rec, error: readErr } = await sb
    .from("founder_recommendations").select("id, company_id").eq("id", args.id).single();
  if (readErr) throw readErr;
  await ensureFounderOrAdmin(sb, userId, rec.company_id);
  const patch: Record<string, unknown> = { status: args.status };
  if (args.status === "acknowledged") {
    patch.acknowledged_by = userId;
    patch.acknowledged_at = new Date().toISOString();
  }
  const { data, error } = await sb
    .from("founder_recommendations")
    .update(patch as never)
    .eq("id", args.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ============================ Founder Health ========================= */

export async function founderHealth(sb: SB, userId: string, companyId?: string | null) {
  await ensureFounderOrAdmin(sb, userId, companyId ?? null);

  const [
    incidents, deploys, backups, replication, agents, autoRuns, obsComponents,
  ] = await Promise.all([
    sb.from("incidents").select("severity, status").in("status", ["open","investigating","identified"]).limit(200),
    sb.from("project_deployments").select("status, created_at").order("created_at", { ascending: false }).limit(50),
    sb.from("bkp_jobs").select("status, started_at").order("started_at", { ascending: false }).limit(50),
    sb.from("ha_replication_checks").select("status, checked_at").order("checked_at", { ascending: false }).limit(50),
    sb.from("agent_metrics_daily").select("success_count, failure_count, latency_p95_ms").order("day", { ascending: false }).limit(7),
    sb.from("auto_runs").select("status, started_at").order("started_at", { ascending: false }).limit(50),
    sb.from("obs_status_components").select("name, status").limit(200),
  ]);

  const okRatio = <T extends { status?: string | null }>(rows: T[] | null | undefined, okValues: string[]) => {
    const list = rows ?? [];
    if (!list.length) return 1;
    const ok = list.filter(r => r.status && okValues.includes(r.status)).length;
    return ok / list.length;
  };

  const grade = (r: number) => (r >= 0.98 ? "green" : r >= 0.9 ? "yellow" : "red");

  return {
    platform: {
      components: obsComponents.data ?? [],
      ratio: okRatio(obsComponents.data, ["operational", "ok", "green"]),
    },
    deployment: {
      ratio: okRatio(deploys.data, ["succeeded", "deployed", "success"]),
      status: grade(okRatio(deploys.data, ["succeeded", "deployed", "success"])),
    },
    backup: {
      ratio: okRatio(backups.data, ["succeeded", "completed", "ok"]),
      status: grade(okRatio(backups.data, ["succeeded", "completed", "ok"])),
    },
    replication: {
      ratio: okRatio(replication.data, ["healthy", "ok"]),
      status: grade(okRatio(replication.data, ["healthy", "ok"])),
    },
    ai: {
      samples: agents.data ?? [],
    },
    automation: {
      ratio: okRatio(autoRuns.data, ["succeeded", "completed"]),
      status: grade(okRatio(autoRuns.data, ["succeeded", "completed"])),
    },
    incidents: {
      open_count: incidents.data?.length ?? 0,
      critical: (incidents.data ?? []).filter(i => i.severity === "critical").length,
    },
    generated_at: new Date().toISOString(),
  };
}

/* ============================ Executive Search ======================= */

/**
 * Federated read across major entity types. Reuses each runtime's data,
 * never introduces a new search index — the universal search runtime
 * remains the authoritative full-text search.
 */
export async function executiveSearch(
  sb: SB, userId: string, query: string, opts: { limit?: number; company_id?: string | null } = {},
) {
  await ensureFounderOrAdmin(sb, userId, opts.company_id ?? null);
  const q = query.trim();
  if (!q) return { query: q, results: [] };
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const cap = Math.min(20, Math.max(1, opts.limit ?? 10));

  const [customers, deals, invoices, listings, plugins] = await Promise.all([
    sb.from("customers").select("id, name, email, company_id").ilike("name", like).limit(cap),
    sb.from("deals").select("id, title, stage, amount_cents, company_id").ilike("title", like).limit(cap),
    sb.from("invoices").select("id, number, total_cents, status, company_id").ilike("number", like).limit(cap),
    sb.from("listings").select("id, title, slug, category, status").ilike("title", like).limit(cap),
    sb.from("plugins").select("id, name, slug, status").ilike("name", like).limit(cap),
  ]);

  return {
    query: q,
    results: {
      customers: customers.data ?? [],
      deals: deals.data ?? [],
      invoices: invoices.data ?? [],
      listings: listings.data ?? [],
      plugins: plugins.data ?? [],
    },
  };
}
