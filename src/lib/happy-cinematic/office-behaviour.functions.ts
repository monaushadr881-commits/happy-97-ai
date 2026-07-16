import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { pickOfficeAction, type OfficeAction } from "./office-behaviour";

export const nextOfficeAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tMs: number; lastByAction?: Record<string, number> }) => d)
  .handler(async ({ data, context }): Promise<{ action: OfficeAction }> => {
    await requireCinematicUser(context as any);
    return { action: pickOfficeAction(data.tMs, data.lastByAction ?? {}) };
  });
