/**
 * HAPPY Enterprise Edition v3.2 — Enterprise Brain Kernel
 *
 * HAPPY is ALWAYS the ONLY Digital Human. This kernel orchestrates every
 * internal capability (memory, planning, reasoning, execution, validation,
 * reflection, learning, analytics) through a single deterministic pipeline.
 *
 * Never expose chain-of-thought. Never spawn secondary AI identities.
 * All engines are pure, in-memory, side-effect-free and safe for SSR.
 */

import { intentRouter, type IntentKind } from "./intent";
import { contextCollector } from "./context";
import { memoryCoordinator } from "./memory";
import { capabilityCoordinator } from "./capability";
import { reasoningEngine } from "./reasoning";
import { planningEngine } from "./planning";
import { executionEngine } from "./execution";
import { validationEngine } from "./validation";
import { reflectionEngine } from "./reflection";
import { learningEngine } from "./learning";
import { analyticsEngine } from "./analytics";
import { confidenceEngine } from "./confidence";
import { priorityEngine } from "./priority";
import { safetyEngine } from "./safety";
import { conversationBrain } from "./conversation";

type Bucket = {
  items: Array<{ id: string; op: string; input: unknown; at: string }>;
  history: Array<{ id: string; at: string; op: string; ok: boolean; ms: number }>;
  settings: Record<string, unknown>;
};

const buckets: Record<string, Bucket> = Object.create(null);
const bucket = (m: string): Bucket => (buckets[m] ??= { items: [], history: [], settings: {} });
const uid = () => `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

export interface BrainRequest {
  input?: string;
  goal?: string;
  intent?: IntentKind;
  capability?: string;
  context?: Record<string, unknown>;
  constraints?: string[];
}

export const brainKernel = {
  // ---------- per-module surface used by every runtime service ----------
  list(module: string) { return bucket(module).items.slice(-25); },
  get(module: string, i: unknown) {
    const id = (i as { id?: string })?.id;
    return bucket(module).items.find((x) => x.id === id) ?? null;
  },
  record(module: string, op: string, input: unknown) {
    const rec = { id: uid(), op, input, at: new Date().toISOString() };
    const b = bucket(module);
    b.items.push(rec);
    if (b.items.length > 200) b.items.splice(0, b.items.length - 200);
    return rec;
  },
  history(module: string) { return bucket(module).history.slice(-50); },
  settings(module: string) { return bucket(module).settings; },
  updateSettings(module: string, i: unknown) {
    const patch = (i && typeof i === "object" ? (i as Record<string, unknown>) : {});
    bucket(module).settings = { ...bucket(module).settings, ...patch };
    return bucket(module).settings;
  },
  live(module: string) {
    const b = bucket(module);
    return { module, queue: b.items.length, lastAt: b.items.at(-1)?.at ?? null, active: true };
  },
  analytics(module: string) {
    const b = bucket(module);
    const ok = b.history.filter((h) => h.ok).length;
    const total = b.history.length || 1;
    const avgMs = Math.round(b.history.reduce((a, h) => a + h.ms, 0) / total);
    return {
      module,
      total: b.history.length,
      successRate: clamp(ok / total),
      avgLatencyMs: avgMs || 12,
      items: b.items.length,
    };
  },
  health(module: string) {
    const a = brainKernel.analytics(module);
    const score = clamp(0.6 + a.successRate * 0.4);
    return { module, score, state: score > 0.85 ? "healthy" : score > 0.6 ? "degraded" : "unhealthy" };
  },

  // ---------- pipeline entry ----------
  async execute(module: string, userId: string | undefined, input: unknown) {
    const started = Date.now();
    const req: BrainRequest = (input && typeof input === "object" ? (input as BrainRequest) : { input: String(input ?? "") });
    const id = uid();
    try {
      const safety = safetyEngine.check(req);
      if (!safety.ok) throw new Error(`safety:${safety.reason}`);
      const intent = req.intent ?? intentRouter.detect(req.input ?? req.goal ?? "");
      const ctx = contextCollector.collect(userId, intent, req.context);
      const mem = memoryCoordinator.recall(userId, intent, req.input ?? "");
      const capability = req.capability ?? capabilityCoordinator.select(intent);
      const reason = reasoningEngine.analyze(req, intent, mem);
      const plan = planningEngine.build(reason, capability);
      const priority = priorityEngine.rank(plan);
      const exec = executionEngine.run(plan, priority);
      const validation = validationEngine.check(exec);
      const confidence = confidenceEngine.score({ reason, validation, exec });
      const response = conversationBrain.compose({ intent, capability, exec, validation, confidence });
      const reflection = reflectionEngine.evaluate({ validation, confidence });
      memoryCoordinator.commit(userId, { intent, capability, response, at: new Date().toISOString() });

      learningEngine.observe(module, { intent, capability, confidence, reflection });
      analyticsEngine.mark(module, Date.now() - started, true);
      const rec = { id, op: "execute", input: req, at: new Date().toISOString() };
      bucket(module).items.push(rec);
      bucket(module).history.push({ id, at: rec.at, op: "execute", ok: true, ms: Date.now() - started });
      return {
        id, module, ok: true, intent, capability, confidence,
        plan, response, validation, reflection,
        latencyMs: Date.now() - started,
      };
    } catch (e) {
      const ms = Date.now() - started;
      analyticsEngine.mark(module, ms, false);
      bucket(module).history.push({ id, at: new Date().toISOString(), op: "execute", ok: false, ms });
      return { id, module, ok: false, error: e instanceof Error ? e.message : "brain_error", latencyMs: ms };
    }
  },

  // ---------- brain-level surface ----------
  brainStatus() {
    return {
      module: "enterprise-brain",
      status: "active" as const,
      digitalHuman: "HAPPY",
      identities: 1,
      engines: [
        "intent","context","memory","capability","reasoning","planning",
        "execution","validation","reflection","learning","analytics",
        "confidence","priority","safety","conversation",
      ],
      version: "v3.2",
    };
  },
  brainAnalytics() {
    const mods = Object.keys(buckets);
    return {
      modules: mods.length,
      totalItems: mods.reduce((a, m) => a + buckets[m].items.length, 0),
      totalHistory: mods.reduce((a, m) => a + buckets[m].history.length, 0),
      perModule: mods.map((m) => brainKernel.analytics(m)),
    };
  },
  brainHealth() {
    const mods = Object.keys(buckets);
    const scores = mods.map((m) => brainKernel.health(m).score);
    const overall = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.95;
    return { overall, modules: mods.length, state: overall > 0.85 ? "healthy" : "degraded" };
  },
  memorySnapshot() { return memoryCoordinator.snapshot(); },
  async process(userId: string | undefined, input: unknown) {
    return brainKernel.execute("brain", userId, input);
  },
  reason(i: unknown) { return reasoningEngine.analyze((i ?? {}) as BrainRequest, "question", []); },
  plan(i: unknown) { return planningEngine.build(reasoningEngine.analyze((i ?? {}) as BrainRequest, "task", []), "auto"); },
  validate(i: unknown) { return validationEngine.check(i as never); },
  reflect(i: unknown) { return reflectionEngine.evaluate(i as never); },
};
