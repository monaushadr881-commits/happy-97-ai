/**
 * HAPPY X — Workflow Engine (Phase 3.9). In-memory workflow runtime with
 * approval / retry / rollback / monitoring / timeline / analytics.
 */
import { executeCapability, type ExecutionRecord, type CapabilityId } from "./kernel";

export type WorkflowStatus = "pending_approval" | "queued" | "running" | "succeeded" | "failed" | "rolled_back" | "cancelled";
export interface WorkflowStep { id: string; name: string; capability: CapabilityId; tool?: string; }
export interface WorkflowRun {
  id: string;
  name: string;
  userId: string;
  requiresApproval: boolean;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  attempts: number;
  maxAttempts: number;
  history: { at: number; action: string; note?: string }[];
  executions: ExecutionRecord[];
  createdAt: number;
  updatedAt: number;
}

const RUNS: WorkflowRun[] = [];
const MAX_RUNS = 200;
let counter = 0;

export function createRun(input: { userId: string; name: string; steps: WorkflowStep[]; requiresApproval?: boolean; maxAttempts?: number }): WorkflowRun {
  const run: WorkflowRun = {
    id: `wf_${Date.now().toString(36)}_${(++counter).toString(36)}`,
    name: input.name,
    userId: input.userId,
    requiresApproval: input.requiresApproval ?? false,
    status: input.requiresApproval ? "pending_approval" : "queued",
    steps: input.steps,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 3,
    history: [{ at: Date.now(), action: "created" }],
    executions: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  RUNS.push(run);
  if (RUNS.length > MAX_RUNS) RUNS.splice(0, RUNS.length - MAX_RUNS);
  if (!run.requiresApproval) executeRun(run.id);
  return run;
}

function executeRun(id: string, opts: { simulateFailure?: boolean; recover?: boolean } = {}) {
  const run = RUNS.find((r) => r.id === id);
  if (!run) return;
  if (run.status === "pending_approval" || run.status === "cancelled" || run.status === "rolled_back") return;
  run.status = "running";
  run.attempts++;
  run.updatedAt = Date.now();
  run.history.push({ at: Date.now(), action: "started", note: `attempt ${run.attempts}` });
  let failed = false;
  for (const step of run.steps) {
    const rec = executeCapability(
      { userId: run.userId, capability: step.capability, tool: step.tool, utterance: step.name },
      { simulateFailure: opts.simulateFailure, recover: opts.recover },
    );
    run.executions.push(rec);
    if (rec.status === "failed") { failed = true; break; }
  }
  run.status = failed ? "failed" : "succeeded";
  run.history.push({ at: Date.now(), action: run.status });
  run.updatedAt = Date.now();
}

export function approve(id: string, approved: boolean): WorkflowRun | undefined {
  const run = RUNS.find((r) => r.id === id);
  if (!run || run.status !== "pending_approval") return run;
  if (!approved) { run.status = "cancelled"; run.history.push({ at: Date.now(), action: "rejected" }); run.updatedAt = Date.now(); return run; }
  run.status = "queued";
  run.history.push({ at: Date.now(), action: "approved" });
  executeRun(run.id);
  return run;
}

export function retry(id: string): WorkflowRun | undefined {
  const run = RUNS.find((r) => r.id === id);
  if (!run) return;
  if (run.attempts >= run.maxAttempts) { run.history.push({ at: Date.now(), action: "retry_denied", note: "max attempts" }); return run; }
  run.history.push({ at: Date.now(), action: "retry_requested" });
  executeRun(run.id, { simulateFailure: false });
  return run;
}

export function rollback(id: string): WorkflowRun | undefined {
  const run = RUNS.find((r) => r.id === id);
  if (!run) return;
  run.status = "rolled_back";
  run.history.push({ at: Date.now(), action: "rolled_back" });
  run.updatedAt = Date.now();
  return run;
}

export function cancel(id: string): WorkflowRun | undefined {
  const run = RUNS.find((r) => r.id === id);
  if (!run) return;
  run.status = "cancelled";
  run.history.push({ at: Date.now(), action: "cancelled" });
  run.updatedAt = Date.now();
  return run;
}

export function listRuns(limit = 50) { return RUNS.slice(-limit).reverse(); }
export function liveRuns() { return RUNS.filter((r) => r.status === "running" || r.status === "pending_approval" || r.status === "queued"); }
export function getRun(id: string) { return RUNS.find((r) => r.id === id); }

export function workflowHealth() {
  const recent = RUNS.slice(-100);
  const failed = recent.filter((r) => r.status === "failed").length;
  const rate = recent.length ? (recent.length - failed) / recent.length : 1;
  return { status: rate >= 0.9 ? "healthy" : rate >= 0.7 ? "degraded" : "critical", successRate: Number(rate.toFixed(3)), sampled: recent.length, live: liveRuns().length };
}

export function workflowTimeline(limit = 30) {
  return RUNS.slice(-limit).flatMap((r) => r.history.map((h) => ({ runId: r.id, name: r.name, action: h.action, at: h.at, note: h.note })))
    .sort((a, b) => b.at - a.at).slice(0, 100);
}

export function workflowAnalytics() {
  const perStatus: Record<string, number> = {};
  for (const r of RUNS) perStatus[r.status] = (perStatus[r.status] ?? 0) + 1;
  const avgSteps = RUNS.length ? Math.round(RUNS.reduce((n, r) => n + r.steps.length, 0) / RUNS.length) : 0;
  return { total: RUNS.length, perStatus, avgSteps, health: workflowHealth(), timestamp: Date.now() };
}
