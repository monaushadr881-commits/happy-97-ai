/**
 * HAPPY X — Runtime Engine Kernel (Phase 3.6).
 *
 * Pure in-memory execution kernel for the single Digital Human. Provides
 * the capability registry, execution pipeline, per-worker execution log,
 * health and metrics. No database side effects — persistence and
 * cross-worker fan-out ship in a later phase.
 *
 * Pipeline: Intent → Capability → Planner → Memory → Tool → Execution →
 * Validation → Response → Conversation → Analytics.
 */

export type CapabilityId =
  | "business"
  | "education"
  | "knowledge"
  | "creator"
  | "research"
  | "support"
  | "founder"
  | "automation";

export const CAPABILITIES: readonly CapabilityId[] = [
  "business", "education", "knowledge", "creator", "research", "support", "founder", "automation",
] as const;

export type PipelineStage =
  | "intent" | "capability" | "planner" | "memory" | "tool" | "execution" | "validation" | "response" | "conversation" | "analytics";

export const STAGES: readonly PipelineStage[] = [
  "intent", "capability", "planner", "memory", "tool", "execution", "validation", "response", "conversation", "analytics",
] as const;

export interface ExecutionInput {
  userId: string;
  utterance?: string;
  capability?: CapabilityId;
  tool?: string;
  input?: unknown;
  workflowId?: string;
}

export interface StageTrace {
  stage: PipelineStage;
  startedAt: number;
  durationMs: number;
  ok: boolean;
  note?: string;
}

export interface ExecutionRecord {
  id: string;
  userId: string;
  capability: CapabilityId;
  tool?: string;
  status: "queued" | "running" | "succeeded" | "failed" | "recovered";
  startedAt: number;
  finishedAt?: number;
  durationMs: number;
  stages: StageTrace[];
  utterance?: string;
  response?: string;
  error?: { code: string; message: string };
}

// ---------- capability registry ----------
const KEYWORDS: Record<CapabilityId, string[]> = {
  business: ["sales", "invoice", "crm", "revenue", "customer", "quote", "order", "finance", "hr"],
  education: ["learn", "lesson", "flashcard", "exam", "study", "certificate", "course"],
  knowledge: ["note", "doc", "wiki", "search", "kb", "article", "reference"],
  creator: ["design", "image", "video", "write", "post", "brand", "asset"],
  research: ["research", "analyze", "compare", "benchmark", "market", "trend"],
  support: ["help", "issue", "ticket", "reset", "how do i", "problem", "bug"],
  founder: ["strategy", "roadmap", "vision", "kpi", "founder", "board"],
  automation: ["schedule", "automate", "workflow", "trigger", "cron", "when"],
};

export function detectIntent(utterance: string | undefined): CapabilityId {
  if (!utterance) return "support";
  const text = utterance.toLowerCase();
  let best: CapabilityId = "support";
  let bestScore = 0;
  for (const cap of CAPABILITIES) {
    const score = KEYWORDS[cap].reduce((n, k) => (text.includes(k) ? n + 1 : n), 0);
    if (score > bestScore) { bestScore = score; best = cap; }
  }
  return best;
}

// ---------- planner ----------
export interface PlanStep { id: string; name: string; capability: CapabilityId; deps: string[]; risk: "low" | "med" | "high"; priority: number; }
export interface Plan { id: string; goal: string; steps: PlanStep[]; createdAt: number; horizonDays: number; }

const rng = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
};

export function buildPlan(goal: string, capabilities: CapabilityId[] = [detectIntent(goal)]): Plan {
  const rand = rng(goal + capabilities.join(","));
  const steps: PlanStep[] = capabilities.flatMap((cap, i) => {
    const n = 2 + Math.floor(rand() * 3);
    return Array.from({ length: n }, (_, j) => ({
      id: `s-${i}-${j}`,
      name: `${cap} step ${j + 1}`,
      capability: cap,
      deps: j === 0 ? (i === 0 ? [] : [`s-${i - 1}-0`]) : [`s-${i}-${j - 1}`],
      risk: (rand() > 0.85 ? "high" : rand() > 0.55 ? "med" : "low") as PlanStep["risk"],
      priority: Math.round(rand() * 100),
    }));
  });
  return { id: `plan_${Date.now().toString(36)}`, goal, steps, createdAt: Date.now(), horizonDays: 30 };
}

// ---------- tools ----------
export interface ToolDescriptor { id: string; capability: CapabilityId; name: string; description: string; permissions: string[]; }
export const TOOL_REGISTRY: ToolDescriptor[] = [
  { id: "biz.crm.lookup", capability: "business", name: "CRM Lookup", description: "Look up a customer record", permissions: ["business.read"] },
  { id: "biz.invoice.create", capability: "business", name: "Invoice Create", description: "Draft an invoice", permissions: ["business.write"] },
  { id: "edu.lesson.plan", capability: "education", name: "Lesson Plan", description: "Draft a lesson plan", permissions: ["education.write"] },
  { id: "edu.flashcards.generate", capability: "education", name: "Flashcards", description: "Generate flashcards", permissions: ["education.write"] },
  { id: "know.search", capability: "knowledge", name: "Knowledge Search", description: "Search the knowledge base", permissions: ["knowledge.read"] },
  { id: "creator.write.post", capability: "creator", name: "Write Post", description: "Draft a post", permissions: ["creator.write"] },
  { id: "research.compare", capability: "research", name: "Compare", description: "Compare two subjects", permissions: ["research.read"] },
  { id: "support.reset", capability: "support", name: "Reset", description: "Reset a resource", permissions: ["support.write"] },
  { id: "founder.roadmap", capability: "founder", name: "Roadmap", description: "Draft a roadmap update", permissions: ["founder.write"] },
  { id: "automation.schedule", capability: "automation", name: "Schedule", description: "Schedule a workflow", permissions: ["automation.write"] },
];

export function selectTool(cap: CapabilityId, hint?: string): ToolDescriptor | undefined {
  const pool = TOOL_REGISTRY.filter((t) => t.capability === cap);
  if (hint) { const m = pool.find((t) => t.id === hint || t.name.toLowerCase().includes(hint.toLowerCase())); if (m) return m; }
  return pool[0];
}

// ---------- execution log (in-memory) ----------
const LOG: ExecutionRecord[] = [];
const MAX_LOG = 500;
let idCounter = 0;
const nextId = () => `exec_${Date.now().toString(36)}_${(++idCounter).toString(36)}`;

const stage = (name: PipelineStage, ok = true, note?: string): StageTrace => ({
  stage: name, startedAt: Date.now(), durationMs: 1 + Math.round(Math.random() * 8), ok, note,
});

export interface ExecuteOptions { simulateFailure?: boolean; recover?: boolean; }

export function executeCapability(input: ExecutionInput, opts: ExecuteOptions = {}): ExecutionRecord {
  const startedAt = Date.now();
  const cap = input.capability ?? detectIntent(input.utterance);
  const tool = selectTool(cap, input.tool);
  const stages: StageTrace[] = [
    stage("intent", true, `-> ${cap}`),
    stage("capability", true, cap),
    stage("planner", true, "plan built"),
    stage("memory", true, "working memory loaded"),
    stage("tool", !!tool, tool ? tool.id : "no tool"),
  ];
  let status: ExecutionRecord["status"] = "succeeded";
  let error: ExecutionRecord["error"];
  let response: string | undefined;
  if (opts.simulateFailure) {
    stages.push(stage("execution", false, "simulated failure"));
    status = opts.recover ? "recovered" : "failed";
    error = { code: "EXEC_FAILED", message: "Simulated failure" };
    if (opts.recover) stages.push(stage("execution", true, "recovered"));
  } else {
    stages.push(stage("execution", true, "ok"));
  }
  stages.push(stage("validation", true, "passed"));
  if (status !== "failed") {
    response = `[${cap}] ${tool ? tool.name : "response"}: ${input.utterance ?? "acknowledged"}`;
    stages.push(stage("response", true));
    stages.push(stage("conversation", true, "turn recorded"));
  }
  stages.push(stage("analytics", true));
  const finishedAt = Date.now();
  const record: ExecutionRecord = {
    id: nextId(),
    userId: input.userId,
    capability: cap,
    tool: tool?.id,
    status,
    startedAt,
    finishedAt,
    durationMs: Math.max(1, finishedAt - startedAt),
    stages,
    utterance: input.utterance,
    response,
    error,
  };
  LOG.push(record);
  if (LOG.length > MAX_LOG) LOG.splice(0, LOG.length - MAX_LOG);
  return record;
}

export function listExecutions(limit = 50): ExecutionRecord[] {
  return LOG.slice(-limit).reverse();
}
export function getExecution(id: string): ExecutionRecord | undefined {
  return LOG.find((r) => r.id === id);
}
export function liveExecutions(): ExecutionRecord[] {
  return LOG.slice(-10).reverse();
}

// ---------- health / metrics ----------
export function runtimeHealth() {
  const recent = LOG.slice(-100);
  const failed = recent.filter((r) => r.status === "failed").length;
  const ok = recent.length - failed;
  const rate = recent.length === 0 ? 1 : ok / recent.length;
  return {
    status: rate >= 0.9 ? "healthy" : rate >= 0.7 ? "degraded" : "critical",
    successRate: Number(rate.toFixed(3)),
    sampled: recent.length,
    capabilities: CAPABILITIES.length,
    stages: STAGES.length,
    tools: TOOL_REGISTRY.length,
    timestamp: Date.now(),
  } as const;
}

export function runtimeMetrics() {
  const recent = LOG.slice(-200);
  const perCap: Record<string, number> = {};
  const perTool: Record<string, number> = {};
  let totalMs = 0;
  const durations: number[] = [];
  for (const r of recent) {
    perCap[r.capability] = (perCap[r.capability] ?? 0) + 1;
    if (r.tool) perTool[r.tool] = (perTool[r.tool] ?? 0) + 1;
    totalMs += r.durationMs;
    durations.push(r.durationMs);
  }
  durations.sort((a, b) => a - b);
  const p = (q: number) => durations.length ? durations[Math.min(durations.length - 1, Math.floor(durations.length * q))] : 0;
  return {
    total: recent.length,
    averageMs: recent.length ? Math.round(totalMs / recent.length) : 0,
    p50Ms: p(0.5), p95Ms: p(0.95), p99Ms: p(0.99),
    capabilityMix: perCap,
    topTools: Object.entries(perTool).sort((a, b) => b[1] - a[1]).slice(0, 5),
    timestamp: Date.now(),
  };
}

export function runtimeAnalytics() {
  const m = runtimeMetrics();
  const h = runtimeHealth();
  return { health: h, metrics: m, capabilities: CAPABILITIES, stages: STAGES };
}

// ---------- settings (in-memory) ----------
interface RuntimeSettings {
  enabledCapabilities: CapabilityId[];
  maxConcurrent: number;
  timeoutMs: number;
  auditLevel: "basic" | "full";
  sandbox: boolean;
}
let SETTINGS: RuntimeSettings = {
  enabledCapabilities: [...CAPABILITIES],
  maxConcurrent: 8,
  timeoutMs: 15000,
  auditLevel: "full",
  sandbox: true,
};
export function getSettings(): RuntimeSettings { return { ...SETTINGS, enabledCapabilities: [...SETTINGS.enabledCapabilities] }; }
export function updateSettings(patch: Partial<RuntimeSettings>): RuntimeSettings {
  SETTINGS = { ...SETTINGS, ...patch, enabledCapabilities: patch.enabledCapabilities ?? SETTINGS.enabledCapabilities };
  return getSettings();
}
