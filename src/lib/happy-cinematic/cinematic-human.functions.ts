import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { planEntry, planExit, planGreeting } from "./choreography";
import { contextFor, summarizeRoute } from "./workspace-awareness";
import type { CinematicSession, DisplayMode } from "./contracts";

export const startCinematicSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { mode?: DisplayMode; route?: string; isFounder?: boolean; qualityTier?: "ultra" | "high" | "medium" | "low" | "auto"; reducedMotion?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    const route = data.route ?? "/";
    const ctx = contextFor(route);
    const entry = planEntry({ qualityTier: data.qualityTier ?? "auto", reducedMotion: !!data.reducedMotion });
    const greeting = planGreeting(ctx, !!data.isFounder);
    const session: CinematicSession = {
      id: crypto.randomUUID(),
      userId: (context as any).userId,
      mode: data.mode ?? "floating",
      state: "entering",
      startedAt: Date.now(),
      emotion: greeting.emotion,
    };
    return { session, entry, greeting, area: summarizeRoute(route) };
  });

export const endCinematicSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string; reducedMotion?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return { sessionId: data.sessionId, exit: planExit(!!data.reducedMotion), endedAt: Date.now() };
  });
