/** R67 UABR — access gate. Universal builder is available to authenticated
 * founders/admins and (read-only planning) to any signed-in user; write /
 * approval flows delegate to FAIOS which enforces admin-only.
 */
export async function assertUabrAccess(context: { supabase: any; userId: string }) {
  if (!context.userId) throw new Error("Forbidden: sign in required");
}
