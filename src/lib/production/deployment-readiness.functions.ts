import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireProductionUser } from "./gate";
import { evaluateDeploy, type DeployInput } from "./deployment-readiness";

export const runDeploymentAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: DeployInput) => d)
  .handler(async ({ data, context }) => {
    await requireProductionUser(context as any);
    return evaluateDeploy(data);
  });
