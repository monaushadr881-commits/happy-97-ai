/**
 * HAPPY X — Tool Engine (Phase 3.8). Dynamic tool discovery, permission
 * validation, sandbox execution, analytics and recovery.
 */
import { TOOL_REGISTRY, type ToolDescriptor, executeCapability, listExecutions } from "./kernel";

export function discover(query?: string, capability?: string): ToolDescriptor[] {
  return TOOL_REGISTRY.filter((t) => {
    if (capability && t.capability !== capability) return false;
    if (query) {
      const q = query.toLowerCase();
      return t.id.includes(q) || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });
}

export function permissionsFor(toolId: string): string[] {
  return TOOL_REGISTRY.find((t) => t.id === toolId)?.permissions ?? [];
}

export function validate(toolId: string, granted: string[] = []): { ok: boolean; missing: string[] } {
  const required = permissionsFor(toolId);
  const missing = required.filter((p) => !granted.includes(p));
  return { ok: missing.length === 0, missing };
}

export function runTool(input: { userId: string; toolId: string; input?: unknown; granted?: string[]; simulateFailure?: boolean; recover?: boolean }) {
  const tool = TOOL_REGISTRY.find((t) => t.id === input.toolId);
  if (!tool) return { ok: false, error: { code: "TOOL_NOT_FOUND", message: `Tool ${input.toolId} not found` } };
  const perm = validate(input.toolId, input.granted ?? tool.permissions);
  if (!perm.ok) return { ok: false, error: { code: "PERMISSION_DENIED", message: `Missing: ${perm.missing.join(",")}` } };
  const rec = executeCapability({ userId: input.userId, capability: tool.capability, tool: tool.id, input: input.input },
    { simulateFailure: input.simulateFailure, recover: input.recover });
  return { ok: rec.status !== "failed", execution: rec };
}

export function toolQueue() {
  return listExecutions(20).filter((r) => r.status === "queued" || r.status === "running").map((r) => ({ id: r.id, tool: r.tool, capability: r.capability }));
}

export function toolHistory(limit = 50) {
  return listExecutions(limit).filter((r) => !!r.tool);
}

export function toolMetrics() {
  const runs = listExecutions(200).filter((r) => !!r.tool);
  const perTool: Record<string, { total: number; failed: number; avgMs: number }> = {};
  const timings: Record<string, number[]> = {};
  for (const r of runs) {
    const key = r.tool!;
    perTool[key] = perTool[key] ?? { total: 0, failed: 0, avgMs: 0 };
    perTool[key].total++;
    if (r.status === "failed") perTool[key].failed++;
    (timings[key] = timings[key] ?? []).push(r.durationMs);
  }
  for (const [k, arr] of Object.entries(timings)) perTool[k].avgMs = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  return { total: runs.length, perTool, timestamp: Date.now() };
}

export function toolHealth() {
  const runs = listExecutions(100).filter((r) => !!r.tool);
  const failed = runs.filter((r) => r.status === "failed").length;
  const rate = runs.length === 0 ? 1 : (runs.length - failed) / runs.length;
  return { status: rate >= 0.9 ? "healthy" : rate >= 0.7 ? "degraded" : "critical", successRate: Number(rate.toFixed(3)), tools: TOOL_REGISTRY.length, sampled: runs.length };
}

export function toolAnalytics() { return { health: toolHealth(), metrics: toolMetrics(), catalog: TOOL_REGISTRY.length }; }
