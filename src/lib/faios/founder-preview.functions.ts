/** R66 FAIOS — preview generation for a planned command. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFaiosAccess } from "./gate";

export const getCommandPreview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ command_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const { data: cmd, error } = await sb.from("faios_commands").select("*").eq("id", data.command_id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!cmd) throw new Error("Command not found");
    const plan = cmd.plan ?? {};
    return {
      command: cmd,
      preview: {
        files_estimated: plan?.impact?.files_touched_estimate ?? 0,
        steps: plan?.steps ?? [],
        risk: plan?.risk ?? "low",
        rollback_plan: plan?.impact?.rollback ?? "revert affected files",
        estimated_minutes: plan?.estimated_minutes ?? 5,
        external_dependencies: plan?.external_dependencies ?? null,
        blocked: Boolean(plan?.blocked),
        blocked_reason: plan?.blocked_reason ?? null,
      },
    };
  });
