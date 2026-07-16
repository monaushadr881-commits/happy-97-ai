/** R72 — presentation-layer confusion detector. Pure function of event history. */

export interface UserSignal {
  tMs: number;
  kind: "idle" | "click" | "back-nav" | "form-reject" | "error";
  target?: string;
}

export interface ConfusionResult {
  confused: boolean;
  reason?: "long-idle" | "repeat-click" | "repeat-back" | "repeat-reject" | "repeat-error";
}

export function detectConfusion(now: number, signals: UserSignal[]): ConfusionResult {
  const recent = (windowMs: number, kind: UserSignal["kind"]) =>
    signals.filter((s) => s.kind === kind && now - s.tMs <= windowMs);

  const lastActivity = signals.length ? Math.max(...signals.map((s) => s.tMs)) : now;
  if (now - lastActivity > 45_000) return { confused: true, reason: "long-idle" };

  const clicks = recent(6_000, "click");
  const byTarget = new Map<string, number>();
  for (const c of clicks) byTarget.set(c.target ?? "", (byTarget.get(c.target ?? "") ?? 0) + 1);
  if ([...byTarget.values()].some((n) => n >= 5)) return { confused: true, reason: "repeat-click" };

  if (recent(10_000, "back-nav").length >= 3) return { confused: true, reason: "repeat-back" };
  if (recent(15_000, "form-reject").length >= 2) return { confused: true, reason: "repeat-reject" };
  if (recent(20_000, "error").length >= 3) return { confused: true, reason: "repeat-error" };

  return { confused: false };
}
