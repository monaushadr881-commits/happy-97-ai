import type { CinematicEntryPlan, GreetingPlan, QualityTier, WalkPlan, WorkspaceContext } from "./contracts";

export function planEntry(input: { qualityTier: QualityTier; reducedMotion: boolean }): CinematicEntryPlan {
  const full = !input.reducedMotion && input.qualityTier !== "low";
  return {
    sequence: full
      ? [
          "soft-ambient-light", "ground-light-ripple", "volumetric-smoke",
          "floating-particles", "ambient-glow", "materialize", "turn",
          "walk-in", "eye-contact", "smile", "breath", "greet",
        ]
      : ["ambient-glow", "materialize", "eye-contact", "greet"],
    durationMs: full ? 3200 : 900,
    qualityTier: input.qualityTier,
    reducedMotion: input.reducedMotion,
  };
}

export function planWalk(from: [number, number], to: [number, number], reducedMotion: boolean): WalkPlan {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = reducedMotion ? 1 : Math.max(4, Math.min(14, Math.round(dist / 60)));
  return {
    from, to, steps,
    cadenceMs: reducedMotion ? 0 : 320,
    turnAtEndDeg: Math.atan2(dy, dx) * (180 / Math.PI),
  };
}

export function planGreeting(ctx: WorkspaceContext, isFounder: boolean): GreetingPlan {
  if (isFounder) {
    return {
      emotion: "supportive",
      lines: [
        "Welcome back.",
        "I was waiting for you.",
        ctx.pendingDeployment
          ? "Your deployment is ready — shall we review it?"
          : "Shall we continue where we left off?",
      ],
      followUp: ctx.hasErrors ? "I also noticed a few issues we should look at." : undefined,
    };
  }
  return {
    emotion: "happy",
    lines: [
      "Hello 👋",
      "I'm HAPPY.",
      "How can I help you today?",
    ],
  };
}

export function planExit(reducedMotion: boolean) {
  return {
    sequence: reducedMotion
      ? ["smile", "goodbye", "dock"] as const
      : ["smile", "goodbye", "turn", "walk-out", "particles-fade", "ground-ripple", "smoke-dissolve", "dock"] as const,
    durationMs: reducedMotion ? 600 : 2400,
  };
}
