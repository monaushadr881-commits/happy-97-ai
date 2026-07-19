import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireProductionUser } from "./gate";
import { evaluateDeploy, type DeployInput } from "./deployment-readiness";

export const runDeploymentAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: DeployInput) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "runDeploymentAudit", source: "api", module: "prod.deploy.runDeploymentAudit" });
    await requireProductionUser(context as any);
    return evaluateDeploy(data);
  });
