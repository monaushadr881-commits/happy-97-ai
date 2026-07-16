import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "@/lib/happy-cinematic/gate";
import { composeLivingCore, type LivingCoreInput } from "./core";
import { planEntry, planExit } from "./entry-exit";
import { shouldSpeak, proactiveLine, type ProactiveInput } from "./proactive";
import { describeContext, type VisualContext } from "./visual-understanding";

export const composeLivingCoreFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: LivingCoreInput) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return composeLivingCore(data);
  });

export const planEntryChoreo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireCinematicUser(context as any);
    return planEntry();
  });

export const planExitChoreo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireCinematicUser(context as any);
    return planExit();
  });

export const evaluateProactive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ProactiveInput) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    const speak = shouldSpeak(data);
    return { speak, line: speak ? proactiveLine(data.signal) : null };
  });

export const describeVisualContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: VisualContext) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return { hint: describeContext(data) };
  });
