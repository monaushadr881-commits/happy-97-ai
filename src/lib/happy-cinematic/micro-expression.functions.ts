import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { expressionFor, type MicroExpression } from "./micro-expression";

export const resolveExpression = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { speaking: boolean; listening: boolean; working: boolean; celebrating: boolean; concerned: boolean }) => d)
  .handler(async ({ data, context }): Promise<{ expression: MicroExpression }> => {
    await requireCinematicUser(context as any);
    return { expression: expressionFor(data) };
  });
