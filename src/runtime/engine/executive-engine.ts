/**
 * HAPPY X — Executive Intelligence Engine (Phase 3.10). Advisor, forecast,
 * opportunities, risks, decisions, recommendations, analytics — synthesised
 * from runtime, planner and workflow engine signals.
 */
import { CAPABILITIES, runtimeAnalytics, runtimeHealth, type CapabilityId } from "./kernel";
import { plannerAnalytics, listRisks } from "./planner";
import { workflowAnalytics, workflowHealth } from "./workflow-engine";

export function advisor(input: { question: string; capability?: CapabilityId }) {
  const rt = runtimeAnalytics();
  const cap = input.capability ?? "founder";
  const focus = rt.metrics.capabilityMix[cap] ?? 0;
  return {
    question: input.question,
    capability: cap,
    guidance: `Focus ${cap}: ${focus} recent runs. Runtime is ${rt.health.status} (success ${Math.round(rt.health.successRate * 100)}%). Prioritise the top-scoring opportunity and mitigate high-risk plan steps first.`,
    signals: { runtime: rt.health, workflows: workflowHealth() },
    timestamp: Date.now(),
  };
}

export function forecast(input: { metric?: string; horizonDays?: number } = {}) {
  const horizon = input.horizonDays ?? 90;
  const rt = runtimeAnalytics();
  const base = rt.metrics.total || 1;
  return {
    metric: input.metric ?? "capability_throughput",
    horizonDays: horizon,
    baseline: base,
    scenarios: [
      { label: "optimistic", value: Math.round(base * (1 + horizon / 60)), confidence: 0.7 },
      { label: "expected",   value: Math.round(base * (1 + horizon / 120)), confidence: 0.85 },
      { label: "pessimistic", value: Math.round(base * (1 + horizon / 240)), confidence: 0.6 },
    ],
    timestamp: Date.now(),
  };
}

export function opportunities() {
  const rt = runtimeAnalytics();
  return CAPABILITIES.map((c) => ({
    capability: c,
    runs: rt.metrics.capabilityMix[c] ?? 0,
    opportunity: (rt.metrics.capabilityMix[c] ?? 0) < 5 ? "growth" : "optimise",
    score: 100 - (rt.metrics.capabilityMix[c] ?? 0),
  })).sort((a, b) => b.score - a.score).slice(0, 6);
}

export function risks() {
  const planner = listRisks();
  const wf = workflowHealth();
  return {
    planSteps: planner.slice(0, 20),
    workflow: wf,
    runtime: runtimeHealth(),
  };
}

export function decide(input: { question: string; options: string[] }) {
  const rt = runtimeHealth();
  const weights = input.options.map((opt) => ({ option: opt, score: Math.round((0.5 + rt.successRate / 2) * 100 + opt.length) }));
  weights.sort((a, b) => b.score - a.score);
  return { question: input.question, choice: weights[0]?.option, ranking: weights, rationale: `Runtime health ${rt.status}; selected the highest scoring option.`, timestamp: Date.now() };
}

export function recommend() {
  const opps = opportunities().slice(0, 5);
  return opps.map((o) => ({
    id: `rec-${o.capability}`,
    capability: o.capability,
    title: `Invest in ${o.capability}`,
    rationale: `${o.opportunity === "growth" ? "Under-served" : "High activity — optimise"} (score ${o.score}).`,
    impact: o.opportunity === "growth" ? "high" : "medium",
  }));
}

export function executiveAnalytics() {
  return {
    runtime: runtimeAnalytics(),
    planner: plannerAnalytics(),
    workflow: workflowAnalytics(),
    opportunities: opportunities(),
    timestamp: Date.now(),
  };
}
