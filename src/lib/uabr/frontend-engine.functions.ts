/** R67 UABR — frontend planner. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertUabrAccess } from "./gate";
import type { UabrFrontendPlan } from "./contracts";

export const generateFrontendPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    modules: z.array(z.string()).min(1).max(60),
    include_admin: z.boolean().default(true),
    include_founder: z.boolean().default(true),
  }).parse(raw))
  .handler(async ({ context, data }): Promise<UabrFrontendPlan> => {
    await assertUabrAccess(context);
    const layouts = ["Root", "Public", "App", "Admin", "Founder"];
    const pages: UabrFrontendPlan["pages"] = [
      { path: "/", kind: "public", sections: ["Hero", "Features", "Pricing", "Footer"] },
      { path: "/dashboard", kind: "app", sections: ["KPIs", "Recent activity", "Quick actions"] },
      ...data.modules.map((m) => ({
        path: `/${m.toLowerCase().replace(/\s+/g, "-")}`,
        kind: "app" as const,
        sections: ["Header", "Filters", "Table", "Detail drawer"],
      })),
    ];
    if (data.include_admin) pages.push({ path: "/admin", kind: "admin", sections: ["Users", "Roles", "Settings", "Audit"] });
    if (data.include_founder) pages.push({ path: "/founder", kind: "founder", sections: ["System", "Health", "Analytics", "Approvals"] });
    return {
      layouts,
      pages,
      components: ["PageHeader", "StatCard", "Panel", "EmptyState", "Chip", "DataTable", "DetailDrawer", "FormLayout"],
      hooks: ["useAuth", "useRole", "useDebounce", "useMediaQuery", "useServerFn"],
      forms: data.modules.map((m) => `${m}Form`),
      charts: ["LineChart", "BarChart", "PieChart", "Heatmap"],
      responsive: ["Mobile-first", "Fluid type", "Container queries where useful", "Safe-area padding"],
    };
  });
