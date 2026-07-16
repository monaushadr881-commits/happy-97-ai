/** R66 FAIOS — shared gate. Founder AI is admin-only. */
export async function assertFaiosAccess(context: { supabase: any; userId: string }) {
  const { data, error } = await (context.supabase as any).rpc("has_role", {
    _user_id: context.userId, _role: "admin",
  });
  if (error) throw new Error(`role check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: Founder AI is admin-only");
}

export async function writeFaiosAudit(
  context: { supabase: any },
  params: { action: string; entity_type?: string; entity_id?: string; metadata?: Record<string, unknown> },
) {
  try {
    await (context.supabase as any).rpc("write_audit", {
      _category: "faios",
      _action: params.action,
      _entity_type: params.entity_type ?? null,
      _entity_id: params.entity_id ?? null,
      _company_id: null,
      _before: null,
      _after: null,
      _severity: "info",
      _metadata: params.metadata ?? {},
    });
  } catch {
    // best-effort
  }
}
