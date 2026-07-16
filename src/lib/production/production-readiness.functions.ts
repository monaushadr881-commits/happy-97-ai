import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireProductionUser } from "./gate";
import { evaluateReadiness, type ReadinessInput } from "./production-readiness";

export const getProductionReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ReadinessInput) => d)
  .handler(async ({ data, context }) => {
    await requireProductionUser(context as any);
    return evaluateReadiness(data);
  });
