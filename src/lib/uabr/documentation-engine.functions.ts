/** R67 UABR — documentation planner. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertUabrAccess } from "./gate";
import type { UabrDocsPlan } from "./contracts";

export const generateDocsPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    project_name: z.string().min(1).max(120),
  }).parse(raw))
  .handler(async ({ context, data }): Promise<UabrDocsPlan> => {
    await assertUabrAccess(context);
    return {
      files: [
        { path: "README.md", purpose: `Overview + quickstart for ${data.project_name}` },
        { path: "docs/architecture.md", purpose: "System architecture & runtime boundaries" },
        { path: "docs/api.md", purpose: "REST + realtime API reference" },
        { path: "docs/database.md", purpose: "Schema, RLS, RBAC" },
        { path: "docs/deployment.md", purpose: "Deploy, rollback, environments" },
        { path: "docs/admin-guide.md", purpose: "Admin operations & permissions" },
        { path: "docs/user-guide.md", purpose: "End-user how-to" },
        { path: "docs/developer-guide.md", purpose: "Contributing, conventions, patterns" },
      ],
    };
  });
