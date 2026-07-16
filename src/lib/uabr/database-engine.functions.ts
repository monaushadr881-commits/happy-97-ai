/** R67 UABR — database engine planner. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertUabrAccess } from "./gate";
import type { UabrDatabasePlan } from "./contracts";

const STANDARD_COLS = [
  { name: "id", type: "uuid PK default gen_random_uuid()" },
  { name: "created_at", type: "timestamptz default now()" },
  { name: "updated_at", type: "timestamptz default now()" },
];

export const generateDatabasePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    tables: z.array(z.string().min(1).max(60)).min(1).max(60),
  }).parse(raw))
  .handler(async ({ context, data }): Promise<UabrDatabasePlan> => {
    await assertUabrAccess(context);
    const tables = data.tables.map((t) => {
      const singular = t.replace(/s$/, "");
      return {
        name: t,
        columns: [
          ...STANDARD_COLS,
          { name: "owner_id", type: "uuid references auth.users" },
          { name: "name", type: "text" },
          { name: "status", type: "text default 'active'" },
          { name: "meta", type: "jsonb default '{}'::jsonb" },
        ],
        rls: [
          `SELECT: owner_id = auth.uid() OR has_role(auth.uid(), 'admin')`,
          `INSERT: owner_id = auth.uid()`,
          `UPDATE: owner_id = auth.uid()`,
          `DELETE: has_role(auth.uid(), 'admin')`,
          `GRANT SELECT, INSERT, UPDATE, DELETE ON public.${t} TO authenticated`,
          `GRANT ALL ON public.${t} TO service_role`,
        ],
      };
    });
    const relationships = tables.length > 1
      ? [{ from: tables[0].name, to: tables[1].name, kind: "one-to-many" as const }]
      : [];
    return {
      tables,
      relationships,
      indexes: tables.map((t) => `CREATE INDEX ON public.${t.name}(owner_id)`),
      storage_buckets: ["assets", "documents", "avatars"],
      seed_hints: ["Seed via same migration; do NOT rely on runtime inserts for demo data."],
    };
  });
