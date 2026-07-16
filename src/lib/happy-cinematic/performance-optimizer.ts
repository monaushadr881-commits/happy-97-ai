/** R73 — animation scheduler heuristics. Pure. */
export type Tier = "ultra" | "high" | "medium" | "low" | "battery";

export function frameBudgetMs(tier: Tier): number {
  return tier === "ultra" || tier === "high" ? 16.6 : tier === "medium" ? 22 : 33;
}

export function particleCap(tier: Tier): number {
  return { ultra: 512, high: 256, medium: 96, low: 32, battery: 0 }[tier];
}

export function shouldRunFrame(lastMs: number, nowMs: number, tier: Tier): boolean {
  return nowMs - lastMs >= frameBudgetMs(tier);
}
