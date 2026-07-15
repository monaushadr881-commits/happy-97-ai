// R31 HAPPY AI Agent Platform — real implementation
// Agents are specialized executors. HAPPY Brain remains the orchestrator.
// All tool calls route through existing runtimes (never direct business writes here).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

export type AgentCode =
  | "founder" | "business" | "finance" | "crm" | "erp" | "hr"
  | "manufacturing" | "warehouse" | "marketplace" | "builder"
  | "deployment" | "support" | "research" | "documentation"
  | "analytics" | "security" | "compliance" | "digital_human";

export type AgentRuntime =
  | "revenue" | "crm" | "erp" | "finance" | "wms" | "mfg" | "builder"
  | "deployment" | "marketplace" | "analytics" | "bi" | "brain" | "memory"
  | "kg" | "notification" | "hrms" | "automation";

// ---------- registry ----------
export interface AgentRegisterInput {
  company_id: string;
  code: AgentCode;
  name: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  capabilities?: string[];
  allowed_runtimes?: AgentRuntime[];
  allowed_actions?: string[];
  max_concurrent?: number;
  max_iterations?: number;
  active?: boolean;
  config?: Record<string, any>;
}

const SYSTEM_AGENT_DEFAULTS: Record<AgentCode, { name: string; capabilities: string[]; allowed_runtimes: AgentRuntime[] }> = {
  founder:        { name: "Founder Agent",       capabilities: ["overview","insight","strategy"],       allowed_runtimes: ["analytics","bi","brain","memory","kg","finance","crm","erp","marketplace"] },
  business:       { name: "Business Agent",      capabilities: ["planning","review"],                  allowed_runtimes: ["analytics","bi","brain","memory","kg"] },
  finance:        { name: "Finance Agent",       capabilities: ["reports","reconciliation"],            allowed_runtimes: ["finance","analytics","bi","memory"] },
  crm:            { name: "CRM Agent",           capabilities: ["leads","deals","tasks"],               allowed_runtimes: ["crm","memory","kg","notification"] },
  erp:            { name: "ERP Agent",           capabilities: ["orders","procurement"],                allowed_runtimes: ["erp","wms","finance"] },
  hr:             { name: "HR Agent",            capabilities: ["employees","attendance"],              allowed_runtimes: ["hrms","memory"] },
  manufacturing:  { name: "Manufacturing Agent", capabilities: ["production","batches","quality"],      allowed_runtimes: ["mfg","wms","analytics"] },
  warehouse:      { name: "Warehouse Agent",     capabilities: ["inventory","dispatch","reservations"], allowed_runtimes: ["wms","mfg","notification"] },
  marketplace:    { name: "Marketplace Agent",   capabilities: ["listings","moderation"],               allowed_runtimes: ["marketplace","memory","kg"] },
  builder:        { name: "Builder Agent",       capabilities: ["website","app","preview"],             allowed_runtimes: ["builder","deployment"] },
  deployment:     { name: "Deployment Agent",    capabilities: ["deploy","rollback","incident"],        allowed_runtimes: ["deployment","notification"] },
  support:        { name: "Support Agent",       capabilities: ["tickets","escalation"],                allowed_runtimes: ["crm","memory","notification"] },
  research:       { name: "Research Agent",      capabilities: ["gather","summarize"],                  allowed_runtimes: ["memory","kg","brain"] },
  documentation:  { name: "Documentation Agent", capabilities: ["write","publish"],                     allowed_runtimes: ["memory","kg"] },
  analytics:      { name: "Analytics Agent",     capabilities: ["reports","forecasts"],                 allowed_runtimes: ["analytics","bi","memory"] },
  security:       { name: "Security Agent",      capabilities: ["audit","alerts"],                      allowed_runtimes: ["memory","notification"] },
  compliance:     { name: "Compliance Agent",    capabilities: ["policy","audit"],                      allowed_runtimes: ["memory","kg"] },
  digital_human:  { name: "Digital Human Agent", capabilities: ["voice","chat","persona"],              allowed_runtimes: ["brain","memory","kg"] },
};

export async function agentRegister(sb: SB, userId: string, input: AgentRegisterInput) {
  const defaults = SYSTEM_AGENT_DEFAULTS[input.code];
  const row = {
    company_id: input.company_id,
    code: input.code,
    kind: "system" as const,
    name: input.name || defaults?.name || input.code,
    description: input.description ?? null,
    system_prompt: input.system_prompt ?? null,
    model: input.model ?? "google/gemini-2.5-flash",
    capabilities: input.capabilities ?? defaults?.capabilities ?? [],
    allowed_runtimes: input.allowed_runtimes ?? defaults?.allowed_runtimes ?? [],
    allowed_actions: input.allowed_actions ?? [],
    max_concurrent: input.max_concurrent ?? 3,
    max_iterations: input.max_iterations ?? 8,
    active: input.active ?? true,
    config: (input.config ?? {}) as never,
    created_by: userId,
  };
  const { data, error } = await sb.from("agent_registry")
    .upsert(row as never, { onConflict: "company_id,code" })
    .select("*").single();
  if (error) throw error;
  return data;
}

export async function agentSeedSystem(sb: SB, userId: string, company_id: string) {
  const codes = Object.keys(SYSTEM_AGENT_DEFAULTS) as AgentCode[];
  const results = [];
  for (const code of codes) {
    const d = SYSTEM_AGENT_DEFAULTS[code];
    results.push(await agentRegister(sb, userId, {
      company_id, code, name: d.name, capabilities: d.capabilities, allowed_runtimes: d.allowed_runtimes,
    }));
  }
  return { seeded: results.length, agents: results.map(a => ({ id: a.id, code: a.code, name: a.name })) };
}

export async function agentList(sb: SB, _userId: string, opts: { company_id: string; active?: boolean }) {
  let q = sb.from("agent_registry").select("*").eq("company_id", opts.company_id);
  if (opts.active !== undefined) q = q.eq("active", opts.active);
  q = q.order("code");
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function agentGet(sb: SB, _userId: string, id: string) {
  const { data, error } = await sb.from("agent_registry").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function agentResolveByCode(sb: SB, _userId: string, company_id: string, code: AgentCode) {
  const { data, error } = await sb.from("agent_registry").select("*")
    .eq("company_id", company_id).eq("code", code).eq("active", true).maybeSingle();
  if (error) throw error;
  return data;
}

// ---------- task routing ----------
const TASK_TYPE_TO_AGENT: Record<string, AgentCode> = {
  website_generation: "builder",
  app_generation: "builder",
  deployment: "deployment",
  revenue_analysis: "analytics",
  crm_analysis: "crm",
  erp_operations: "erp",
  inventory_review: "warehouse",
  production_summary: "manufacturing",
  financial_reports: "finance",
  marketplace_moderation: "marketplace",
  notifications: "support",
  document_generation: "documentation",
  presentation: "documentation",
  research: "research",
  support: "support",
  founder_overview: "founder",
  hr_review: "hr",
};

export function routeTaskType(task_type: string): AgentCode {
  return TASK_TYPE_TO_AGENT[task_type] ?? "business";
}

// ---------- task lifecycle ----------
export interface TaskAssignInput {
  company_id: string;
  agent_code?: AgentCode;
  task_type: string;
  goal: string;
  input?: Record<string, any>;
  context?: Record<string, any>;
  priority?: number;
  deadline_at?: string;
  parent_task_id?: string;
  workflow_run_id?: string;
  brain_session_id?: string;
}

export async function taskAssign(sb: SB, userId: string, input: TaskAssignInput) {
  const code = input.agent_code ?? routeTaskType(input.task_type);
  const agent = await agentResolveByCode(sb, userId, input.company_id, code);
  if (!agent) throw new Error(`No active agent for code=${code}. Seed system agents first.`);

  const { data, error } = await sb.from("agent_tasks").insert({
    company_id: input.company_id,
    agent_id: agent.id,
    parent_task_id: input.parent_task_id ?? null,
    workflow_run_id: input.workflow_run_id ?? null,
    brain_session_id: input.brain_session_id ?? null,
    requested_by: userId,
    task_type: input.task_type,
    goal: input.goal,
    context: (input.context ?? {}) as never,
    input: (input.input ?? {}) as never,
    priority: input.priority ?? 5,
    deadline_at: input.deadline_at ?? null,
    status: "pending",
  } as never).select("*").single();
  if (error) throw error;

  await sb.from("agent_messages").insert({
    company_id: input.company_id, task_id: data.id, from_agent_id: null, to_agent_id: agent.id,
    channel: "system", role: "system",
    content: `Task assigned: ${input.task_type} — ${input.goal}`,
    metadata: { requested_by: userId, priority: data.priority } as never,
  } as never);

  return { task_id: data.id, agent: { id: agent.id, code: agent.code, name: agent.name }, status: "pending" };
}

// ---------- tool gateway (records intent; runtime execution stays in each runtime) ----------
export interface ToolCallInput {
  company_id: string;
  task_id: string;
  agent_id: string;
  runtime: AgentRuntime;
  action: string;
  arguments?: Record<string, any>;
}

export async function toolCall(sb: SB, _userId: string, input: ToolCallInput) {
  const t0 = Date.now();
  const agent = await agentGet(sb, _userId, input.agent_id);
  if (!agent) throw new Error("agent not found");

  // Security: enforce allowed_runtimes
  const allowed = (agent.allowed_runtimes ?? []) as string[];
  if (allowed.length && !allowed.includes(input.runtime)) {
    const { data } = await sb.from("agent_tool_calls").insert({
      company_id: input.company_id, task_id: input.task_id, agent_id: input.agent_id,
      runtime: input.runtime, action: input.action,
      arguments: (input.arguments ?? {}) as never,
      result_facts: {} as never,
      status: "blocked", error: `runtime ${input.runtime} not in agent.allowed_runtimes`,
      duration_ms: Date.now() - t0,
    } as never).select("*").single();
    return { status: "blocked", reason: "runtime_not_allowed", call: data };
  }

  // We record the intent; actual runtime execution is invoked by the caller
  // via that runtime's server function. This preserves "never bypass business logic".
  const { data, error } = await sb.from("agent_tool_calls").insert({
    company_id: input.company_id, task_id: input.task_id, agent_id: input.agent_id,
    runtime: input.runtime, action: input.action,
    arguments: (input.arguments ?? {}) as never,
    result_facts: { dispatched: true, runtime: input.runtime, action: input.action } as never,
    ai_recommendation: null,
    status: "success", duration_ms: Date.now() - t0,
  } as never).select("*").single();
  if (error) throw error;
  return { status: "success", call: data };
}

// ---------- inter-agent communication ----------
export async function agentSay(sb: SB, _userId: string, input: {
  company_id: string; task_id?: string; from_agent_id?: string; to_agent_id?: string; to_user_id?: string;
  channel: "agent" | "brain" | "automation" | "founder" | "user" | "system";
  role?: "system" | "user" | "assistant" | "tool";
  content: string; metadata?: Record<string, any>;
}) {
  const { data, error } = await sb.from("agent_messages").insert({
    company_id: input.company_id,
    task_id: input.task_id ?? null,
    from_agent_id: input.from_agent_id ?? null,
    to_agent_id: input.to_agent_id ?? null,
    to_user_id: input.to_user_id ?? null,
    channel: input.channel,
    role: input.role ?? "assistant",
    content: input.content.slice(0, 20000),
    metadata: (input.metadata ?? {}) as never,
  } as never).select("*").single();
  if (error) throw error;
  return data;
}

// ---------- task result lifecycle ----------
export async function taskComplete(sb: SB, _userId: string, input: {
  task_id: string; status: "succeeded" | "failed" | "escalated"; result?: Record<string, any>;
  error?: string; escalate_to_code?: AgentCode; escalation_reason?: string;
}) {
  const { data: task, error: te } = await sb.from("agent_tasks").select("*").eq("id", input.task_id).single();
  if (te) throw te;

  let escalated_to: string | null = null;
  if (input.status === "escalated" && input.escalate_to_code) {
    const nextAgent = await agentResolveByCode(sb, _userId, task.company_id, input.escalate_to_code);
    escalated_to = nextAgent?.id ?? null;
    if (nextAgent) {
      await sb.from("agent_tasks").insert({
        company_id: task.company_id, agent_id: nextAgent.id, parent_task_id: task.id,
        requested_by: task.requested_by, task_type: task.task_type,
        goal: `[escalated] ${task.goal}`,
        context: task.context as never, input: task.input as never,
        priority: Math.max(1, (task.priority ?? 5) - 1),
        status: "pending",
      } as never);
    }
  }

  const started = task.started_at ?? task.created_at;
  const duration_ms = started ? Date.now() - new Date(started).getTime() : null;

  const { data, error } = await sb.from("agent_tasks").update({
    status: input.status,
    result: (input.result ?? {}) as never,
    error: input.error ?? null,
    completed_at: new Date().toISOString(),
    duration_ms,
    escalated_to,
    escalation_reason: input.escalation_reason ?? null,
  } as never).eq("id", input.task_id).select("*").single();
  if (error) throw error;
  return data;
}

export async function taskStart(sb: SB, _userId: string, task_id: string) {
  const { data, error } = await sb.from("agent_tasks").update({
    status: "running", started_at: new Date().toISOString(),
  } as never).eq("id", task_id).select("*").single();
  if (error) throw error;
  return data;
}

export async function tasksList(sb: SB, _userId: string, opts: {
  company_id: string; agent_id?: string; status?: string; limit?: number;
}) {
  let q = sb.from("agent_tasks").select("id, agent_id, task_type, goal, status, priority, started_at, completed_at, duration_ms, error, created_at")
    .eq("company_id", opts.company_id);
  if (opts.agent_id) q = q.eq("agent_id", opts.agent_id);
  if (opts.status) q = q.eq("status", opts.status);
  q = q.order("created_at", { ascending: false }).limit(Math.min(opts.limit ?? 50, 200));
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function taskDetail(sb: SB, _userId: string, task_id: string) {
  const [t, msgs, tools] = await Promise.all([
    sb.from("agent_tasks").select("*").eq("id", task_id).maybeSingle(),
    sb.from("agent_messages").select("*").eq("task_id", task_id).order("created_at"),
    sb.from("agent_tool_calls").select("*").eq("task_id", task_id).order("created_at"),
  ]);
  if (t.error) throw t.error;
  return { task: t.data, messages: msgs.data ?? [], tool_calls: tools.data ?? [] };
}

// ---------- analytics ----------
export async function agentHealth(sb: SB, _userId: string, company_id: string) {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [{ count: total }, { count: running }, { count: succeeded }, { count: failed }, { count: escalated }, { data: sample }, { data: agents }] = await Promise.all([
    sb.from("agent_tasks").select("id", { count: "exact", head: true }).eq("company_id", company_id).gte("created_at", since),
    sb.from("agent_tasks").select("id", { count: "exact", head: true }).eq("company_id", company_id).eq("status", "running"),
    sb.from("agent_tasks").select("id", { count: "exact", head: true }).eq("company_id", company_id).eq("status", "succeeded").gte("created_at", since),
    sb.from("agent_tasks").select("id", { count: "exact", head: true }).eq("company_id", company_id).eq("status", "failed").gte("created_at", since),
    sb.from("agent_tasks").select("id", { count: "exact", head: true }).eq("company_id", company_id).eq("status", "escalated").gte("created_at", since),
    sb.from("agent_tasks").select("agent_id, duration_ms, status").eq("company_id", company_id).gte("created_at", since).limit(500),
    sb.from("agent_registry").select("id, code, name").eq("company_id", company_id).eq("active", true),
  ]);

  const byAgent: Record<string, { total: number; succeeded: number; failed: number; ms_sum: number; ms_n: number }> = {};
  for (const r of sample ?? []) {
    const a = (byAgent[r.agent_id] ??= { total: 0, succeeded: 0, failed: 0, ms_sum: 0, ms_n: 0 });
    a.total++;
    if (r.status === "succeeded") a.succeeded++;
    else if (r.status === "failed") a.failed++;
    if (r.duration_ms) { a.ms_sum += r.duration_ms; a.ms_n++; }
  }
  const nameMap = new Map((agents ?? []).map(a => [a.id, { code: a.code, name: a.name }]));
  const per_agent = Object.entries(byAgent).map(([agent_id, s]) => ({
    agent_id,
    agent: nameMap.get(agent_id) ?? { code: "unknown", name: "unknown" },
    tasks_total: s.total,
    tasks_succeeded: s.succeeded,
    tasks_failed: s.failed,
    success_rate_pct: s.total ? Math.round((s.succeeded / s.total) * 100) : 100,
    avg_duration_ms: s.ms_n ? Math.round(s.ms_sum / s.ms_n) : 0,
  })).sort((a, b) => b.tasks_total - a.tasks_total);

  return {
    window_days: 7,
    agents_active: agents?.length ?? 0,
    tasks_total: total ?? 0,
    tasks_running: running ?? 0,
    tasks_succeeded: succeeded ?? 0,
    tasks_failed: failed ?? 0,
    tasks_escalated: escalated ?? 0,
    success_rate_pct: total ? Math.round(((succeeded ?? 0) / total) * 100) : 100,
    per_agent,
    computed_at: new Date().toISOString(),
    note: "computed_from_live_tasks_only",
  };
}
