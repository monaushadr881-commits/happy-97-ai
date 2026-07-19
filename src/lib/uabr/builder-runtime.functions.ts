/** R67 UABR — top-level builder-runtime server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertUabrAccess } from "./gate";
import { planFromPrompt } from "./planner";

const ModeEnum = z.enum(["website", "pwa", "android", "ios", "desktop", "backend", "frontend", "complete", "enterprise"]);

export const submitBuilderRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    prompt: z.string().min(4).max(4000),
    project_name: z.string().max(120).optional(),
    modes: z.array(ModeEnum).max(6).optional(),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "submitBuilderRequest", source: "api", module: "uabr.runtime.submitBuilderRequest" });
    await assertUabrAccess(context);
    const plan = planFromPrompt(data.prompt, { projectName: data.project_name, modes: data.modes });
    return { plan };
  });

export const getBuilderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertUabrAccess(context);
    return {
      version: "r67-uabr-v1",
      engines: [
        "project-planner", "design-engine", "database-engine",
        "backend-engine", "frontend-engine", "documentation-engine",
        "test-engine", "deployment-planner",
      ],
      auto_mode: "off_by_default",
      approval_required: true,
      blocked_by_default: ["native_build", "publishing"],
    };
  });
