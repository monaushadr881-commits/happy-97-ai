/** R66 FAIOS — terminal stream. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFaiosAccess } from "./gate";

export const listTerminal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    limit: z.number().int().min(1).max(500).default(100),
    channel: z.string().optional(),
  }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    let q = sb.from("faios_terminal_lines").select("*").eq("founder_id", context.userId).order("created_at", { ascending: false }).limit(data.limit);
    if (data.channel) q = q.eq("channel", data.channel);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { lines: rows ?? [] };
  });

export const appendTerminal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    message: z.string().min(1).max(4000),
    level: z.enum(["debug", "info", "warn", "error"]).default("info"),
    channel: z.string().max(80).default("founder"),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const { data: row, error } = await sb.from("faios_terminal_lines").insert({
      founder_id: context.userId, channel: data.channel, level: data.level, message: data.message,
    }).select().single();
    if (error) throw new Error(error.message);
    return { line: row };
  });
