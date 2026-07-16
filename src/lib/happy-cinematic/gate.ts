/** R71 CLDHE — auth gate. Reuses Supabase RLS + has_role. Expansion-only. */
export async function requireCinematicUser(context: { supabase: any; userId: string }) {
  if (!context.userId) throw new Error("Unauthorized");
  return { userId: context.userId };
}

export async function requireCinematicAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(`role check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: admin role required");
}
