/** R72 — office idle behaviour scheduler. Deterministic, no per-frame alloc. */

export type OfficeAction =
  | "breath" | "blink" | "glance-notification" | "glance-focused"
  | "look-away" | "look-back" | "shoulder-shift" | "finger-relax"
  | "micro-smile" | "weight-shift" | "posture-adjust";

const POOL: Array<{ action: OfficeAction; weight: number; cooldownMs: number }> = [
  { action: "breath",              weight: 10, cooldownMs: 0 },
  { action: "blink",               weight: 10, cooldownMs: 0 },
  { action: "glance-notification", weight: 3,  cooldownMs: 12_000 },
  { action: "glance-focused",      weight: 4,  cooldownMs: 6_000 },
  { action: "look-away",           weight: 2,  cooldownMs: 18_000 },
  { action: "look-back",           weight: 2,  cooldownMs: 18_000 },
  { action: "shoulder-shift",      weight: 3,  cooldownMs: 9_000 },
  { action: "finger-relax",        weight: 3,  cooldownMs: 8_000 },
  { action: "micro-smile",         weight: 2,  cooldownMs: 14_000 },
  { action: "weight-shift",        weight: 3,  cooldownMs: 7_000 },
  { action: "posture-adjust",      weight: 2,  cooldownMs: 20_000 },
];

function hash(x: number) {
  const s = Math.sin(x * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function pickOfficeAction(tMs: number, lastByAction: Record<string, number>): OfficeAction {
  const eligible = POOL.filter((p) => (tMs - (lastByAction[p.action] ?? -Infinity)) >= p.cooldownMs);
  const total = eligible.reduce((s, p) => s + p.weight, 0) || 1;
  let r = hash(Math.floor(tMs / 250)) * total;
  for (const p of eligible) {
    r -= p.weight;
    if (r <= 0) return p.action;
  }
  return "breath";
}
