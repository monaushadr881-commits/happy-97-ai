/**
 * HAPPY X — Planner Engine (Phase 3.7).
 * Multi-capability planning: goals, dependencies, execution order, risk,
 * priority, scenario, milestones, timeline, analytics.
 */
import { CAPABILITIES, buildPlan, type CapabilityId, type Plan, type PlanStep, detectIntent } from "./kernel";

export interface PlanRequest { goal: string; capabilities?: CapabilityId[]; horizonDays?: number; }

const PLANS: Plan[] = [];
const MAX_PLANS = 200;

export function planGoal(req: PlanRequest): Plan {
  const caps = req.capabilities && req.capabilities.length ? req.capabilities : [detectIntent(req.goal)];
  const plan = buildPlan(req.goal, caps);
  if (req.horizonDays) plan.horizonDays = req.horizonDays;
  PLANS.push(plan);
  if (PLANS.length > MAX_PLANS) PLANS.splice(0, PLANS.length - MAX_PLANS);
  return plan;
}
export function listGoals(): Plan[] { return PLANS.slice(-50).reverse(); }
export function getPlan(id: string): Plan | undefined { return PLANS.find((p) => p.id === id); }

export function resolveDependencies(planOrId: Plan | string): { order: string[]; layers: string[][] } {
  const plan = typeof planOrId === "string" ? getPlan(planOrId) : planOrId;
  if (!plan) return { order: [], layers: [] };
  const map = new Map<string, PlanStep>(plan.steps.map((s) => [s.id, s]));
  const done = new Set<string>();
  const layers: string[][] = [];
  while (done.size < plan.steps.length) {
    const layer = plan.steps.filter((s) => !done.has(s.id) && s.deps.every((d) => done.has(d))).map((s) => s.id);
    if (layer.length === 0) break;
    layers.push(layer);
    layer.forEach((id) => done.add(id));
  }
  return { order: layers.flat(), layers };
}

export function assessRisk(planOrId: Plan | string) {
  const plan = typeof planOrId === "string" ? getPlan(planOrId) : planOrId;
  if (!plan) return { score: 0, breakdown: { low: 0, med: 0, high: 0 } };
  const b = { low: 0, med: 0, high: 0 };
  plan.steps.forEach((s) => { b[s.risk] += 1; });
  const score = Math.min(100, b.low * 1 + b.med * 4 + b.high * 12);
  return { score, breakdown: b, highRiskSteps: plan.steps.filter((s) => s.risk === "high").map((s) => s.id) };
}

export function prioritise(planOrId: Plan | string) {
  const plan = typeof planOrId === "string" ? getPlan(planOrId) : planOrId;
  if (!plan) return [];
  return [...plan.steps].sort((a, b) => b.priority - a.priority).map((s) => ({ id: s.id, name: s.name, priority: s.priority, capability: s.capability }));
}

export function scenarios(planOrId: Plan | string) {
  const plan = typeof planOrId === "string" ? getPlan(planOrId) : planOrId;
  if (!plan) return [];
  return ["optimistic", "expected", "pessimistic"].map((label, i) => ({
    label, etaDays: Math.max(1, Math.round(plan.horizonDays * (0.6 + i * 0.3))), confidence: Math.round(90 - i * 25),
  }));
}

export function milestones(planOrId: Plan | string) {
  const plan = typeof planOrId === "string" ? getPlan(planOrId) : planOrId;
  if (!plan) return [];
  const { layers } = resolveDependencies(plan);
  return layers.map((layer, i) => ({
    id: `m-${i}`, name: `Milestone ${i + 1}`, stepCount: layer.length,
    etaDays: Math.round((plan.horizonDays / Math.max(1, layers.length)) * (i + 1)),
    steps: layer,
  }));
}

export function timeline(planOrId: Plan | string) {
  const plan = typeof planOrId === "string" ? getPlan(planOrId) : planOrId;
  if (!plan) return [];
  const { order } = resolveDependencies(plan);
  const perStep = Math.max(1, Math.round(plan.horizonDays / Math.max(1, order.length)));
  return order.map((id, i) => ({ id, offsetDays: i * perStep, durationDays: perStep }));
}

export function plannerAnalytics() {
  const perCap: Record<string, number> = {};
  let totalSteps = 0, totalHigh = 0;
  for (const p of PLANS) {
    for (const s of p.steps) {
      perCap[s.capability] = (perCap[s.capability] ?? 0) + 1;
      totalSteps++;
      if (s.risk === "high") totalHigh++;
    }
  }
  return {
    plans: PLANS.length,
    totalSteps,
    highRiskSteps: totalHigh,
    capabilityMix: perCap,
    capabilities: CAPABILITIES,
    timestamp: Date.now(),
  };
}

export function listRisks() {
  return PLANS.flatMap((p) => p.steps.filter((s) => s.risk !== "low").map((s) => ({ planId: p.id, stepId: s.id, name: s.name, risk: s.risk, capability: s.capability })));
}
