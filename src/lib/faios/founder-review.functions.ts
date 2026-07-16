/** R66 FAIOS — quality/security/perf/a11y quick review helpers. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFaiosAccess } from "./gate";

export const getReviewSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ command_id: z.string().uuid().optional() }).parse(raw ?? {}))
  .handler(async ({ context }) => {
    await assertFaiosAccess(context);
    return {
      typecheck: { status: "unknown", note: "Run in the build pipeline; this project has a large types.ts affecting duration." },
      lint: { status: "unknown", note: "Reuses existing lint infra." },
      performance: { status: "advisory", checks: ["route bundle size", "image sizing", "lazy loading"] },
      accessibility: { status: "advisory", checks: ["heading order", "alt text", "contrast", "keyboard focus"] },
      security: { status: "advisory", checks: ["RLS unchanged", "no service_role in client", "no PII in public routes"] },
      dependency: { status: "advisory", note: "Use existing dependency scanner." },
      bundle: { status: "advisory", note: "Vite build report available on deploy." },
      routes: { status: "ok", note: "TanStack file routes validate at build time." },
    };
  });
