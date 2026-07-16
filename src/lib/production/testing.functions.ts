import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireProductionUser } from "./gate";
import { evaluateTesting, type TestInput } from "./testing";

export const runTestingAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: TestInput) => d)
  .handler(async ({ data, context }) => {
    await requireProductionUser(context as any);
    return evaluateTesting(data);
  });
