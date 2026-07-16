import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireProductionUser } from "./gate";
import { evaluateQuality, type QualityInput } from "./quality-audit";

export const runQualityAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: QualityInput) => d)
  .handler(async ({ data, context }) => {
    await requireProductionUser(context as any);
    return evaluateQuality(data);
  });
