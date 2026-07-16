import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireProductionUser } from "./gate";
import { evaluateSecurity, type SecInput } from "./security-audit";

export const runSecurityAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: SecInput) => d)
  .handler(async ({ data, context }) => {
    await requireProductionUser(context as any);
    return evaluateSecurity(data);
  });
