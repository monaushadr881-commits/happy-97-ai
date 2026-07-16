import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireProductionUser } from "./gate";
import { evaluatePerf, type PerfInput } from "./performance-audit";

export const runPerformanceAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: PerfInput) => d)
  .handler(async ({ data, context }) => {
    await requireProductionUser(context as any);
    return evaluatePerf(data);
  });
