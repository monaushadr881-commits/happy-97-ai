/** R66 FAIOS — approvals audit list. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFaiosAccess } from "./gate";

export const listApprovals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ limit: z.number().int().min(1).max(500).default(100) }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const { data: rows, error } = await sb.from("faios_approvals")
      .select("*").eq("founder_id", context.userId)
      .order("decided_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return { approvals: rows ?? [] };
  });
