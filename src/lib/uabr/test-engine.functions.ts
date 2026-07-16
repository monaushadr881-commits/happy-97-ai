/** R67 UABR — test planner. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertUabrAccess } from "./gate";
import type { UabrTestPlan } from "./contracts";

export const generateTestPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    modules: z.array(z.string()).min(1).max(60),
  }).parse(raw))
  .handler(async ({ context, data }): Promise<UabrTestPlan> => {
    await assertUabrAccess(context);
    const per = Math.max(3, Math.floor(data.modules.length * 2));
    return {
      suites: [
        { name: "unit", kind: "unit", count: per * 3 },
        { name: "integration", kind: "integration", count: per },
        { name: "e2e", kind: "e2e", count: Math.max(3, Math.floor(per / 2)) },
        { name: "performance", kind: "perf", count: 4 },
        { name: "accessibility", kind: "a11y", count: Math.max(3, data.modules.length) },
        { name: "security", kind: "security", count: 6 },
      ],
    };
  });
