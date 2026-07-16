/** R67 UABR — backend planner (server functions, realtime, jobs). */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertUabrAccess } from "./gate";
import type { UabrBackendPlan } from "./contracts";

export const generateBackendPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    modules: z.array(z.string()).min(1).max(60),
  }).parse(raw))
  .handler(async ({ context, data }): Promise<UabrBackendPlan> => {
    await assertUabrAccess(context);
    const endpoints = data.modules.flatMap((m) => {
      const slug = m.toLowerCase().replace(/\s+/g, "_");
      return [
        { method: "GET" as const, path: `/api/${slug}`, purpose: `List ${m}`, auth: "user" as const },
        { method: "POST" as const, path: `/api/${slug}`, purpose: `Create ${m}`, auth: "user" as const },
        { method: "PATCH" as const, path: `/api/${slug}/:id`, purpose: `Update ${m}`, auth: "user" as const },
        { method: "DELETE" as const, path: `/api/${slug}/:id`, purpose: `Delete ${m}`, auth: "admin" as const },
      ];
    });
    return {
      endpoints,
      realtime_channels: data.modules.map((m) => `channel:${m.toLowerCase().replace(/\s+/g, "_")}`),
      jobs: ["nightly_reports", "cleanup_orphans", "usage_rollup"],
      webhooks: ["billing.paid", "auth.user.created"],
      audit: ["All writes → write_audit(category, action, entity)"],
      rate_limits: ["auth: 30/min/IP", "write: 120/min/user", "read: 600/min/user"],
    };
  });
