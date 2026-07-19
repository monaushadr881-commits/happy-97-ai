/** R67 UABR — project planner server function. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertUabrAccess } from "./gate";
import { planFromPrompt } from "./planner";

const ModeEnum = z.enum(["website", "pwa", "android", "ios", "desktop", "backend", "frontend", "complete", "enterprise"]);

export const generateProjectPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    prompt: z.string().min(4).max(4000),
    project_name: z.string().max(120).optional(),
    modes: z.array(ModeEnum).max(6).optional(),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "generateProjectPlan", source: "api", module: "uabr.project.generateProjectPlan" });
    await assertUabrAccess(context);
    return planFromPrompt(data.prompt, { projectName: data.project_name, modes: data.modes });
  });
