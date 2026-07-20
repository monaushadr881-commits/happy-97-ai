/**
 * R191 Batch 12 — Enterprise Identity / Security / Access Control
 *
 * SINGLE composition surface. Reuses canonical owners only:
 *   - user_roles / roles / role_assignments / role_permissions / permissions
 *   - auth_sessions_meta / auth_devices / auth_login_history
 *   - auth_security_alerts / auth_session_policies
 *   - adoptToCanonicalPipeline (Brain session, canonical audit)
 *   - requestFounderApproval  (R158)
 *   - writeCanonicalAudit
 *
 * NO new tables, NO new runtime, NO new dashboard.
 */
import type { Database } from "@/integrations/supabase/types";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

const SESSION_BULK_REVOKE_APPROVAL_THRESHOLD = 50;

type JsonValue =
  | string | number | boolean | null
  | JsonValue[] | { [k: string]: JsonValue };
type Result = {
  status: "created" | "updated" | "revoked" | "granted" | "acknowledged"
        | "ok" | "pending_approval" | "recorded";
  entity_id?: string;
  approval_id?: string;
  data?: JsonValue;
};

const uuid = z.string().uuid();
const AppRole = z.enum(["founder", "admin", "enterprise", "user"]);
const ScopeType = z.enum(["platform", "company", "brand", "workspace", "department"]);

// ---------------------------------------------------------------------------
// 1. Sessions — list active
// ---------------------------------------------------------------------------
export const idSessionsList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid.optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "session", capability: "list",
      user_id: userId, company_id: data.company_id,
    });
    const q = supabase.from("auth_sessions_meta")
      .select("id,user_id,device_id,session_key,started_at,last_active_at,ended_at,end_reason")
      .is("ended_at", null).order("last_active_at", { ascending: false }).limit(200);
    const { data: rows, error } = data.user_id
      ? await q.eq("user_id", data.user_id) : await q;
    if (error) throw new Error(`sessions_list_failed: ${error.message}`);
    return { status: "ok", data: rows };
  });

// ---------------------------------------------------------------------------
// 2. Sessions — revoke one
// ---------------------------------------------------------------------------
export const idSessionRevoke = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, session_id: uuid, reason: z.string().max(240).optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "session", capability: "revoke",
      user_id: userId, company_id: data.company_id,
    });
    const { error } = await supabase.from("auth_sessions_meta")
      .update({ ended_at: new Date().toISOString(), end_reason: data.reason ?? "revoked" })
      .eq("id", data.session_id);
    if (error) throw new Error(`session_revoke_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.session", action: "revoke",
      entity_type: "auth_sessions_meta", entity_id: data.session_id,
      company_id: data.company_id, severity: "warning",
      metadata: { reason: data.reason ?? null },
    });
    return { status: "revoked", entity_id: data.session_id };
  });

// ---------------------------------------------------------------------------
// 3. Sessions — revoke all for user (Founder-gated at scale)
// ---------------------------------------------------------------------------
export const idSessionRevokeAll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid, reason: z.string().max(240).optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "session", capability: "revoke_all",
      user_id: userId, company_id: data.company_id,
    });
    const { count } = await supabase.from("auth_sessions_meta")
      .select("id", { count: "exact", head: true })
      .eq("user_id", data.user_id).is("ended_at", null);
    const active = count ?? 0;
    if (active >= SESSION_BULK_REVOKE_APPROVAL_THRESHOLD) {
      const a = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "identity.session_bulk_revoke",
          entity_id: data.user_id,
          title: `Revoke ${active} sessions for user`,
          reason: data.reason ?? "session_bulk_threshold",
          metadata: { user_id: data.user_id, active },
        } as never,
      });
      return { status: "pending_approval", approval_id: (a as { id: string }).id };
    }
    const { error } = await supabase.from("auth_sessions_meta")
      .update({ ended_at: new Date().toISOString(), end_reason: data.reason ?? "revoke_all" })
      .eq("user_id", data.user_id).is("ended_at", null);
    if (error) throw new Error(`session_revoke_all_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.session", action: "revoke_all",
      entity_type: "auth_sessions_meta", entity_id: data.user_id,
      company_id: data.company_id, severity: "warning",
      after: { revoked: active },
    });
    return { status: "revoked", entity_id: data.user_id, data: { revoked: active } };
  });

// ---------------------------------------------------------------------------
// 4. Devices — list
// ---------------------------------------------------------------------------
export const idDevicesList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid.optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "device", capability: "list",
      user_id: userId, company_id: data.company_id,
    });
    const q = supabase.from("auth_devices")
      .select("id,user_id,device_name,device_type,browser,os,trusted,emergency_locked,risk_score,last_seen_at,revoked_at")
      .order("last_seen_at", { ascending: false }).limit(200);
    const { data: rows, error } = data.user_id
      ? await q.eq("user_id", data.user_id) : await q;
    if (error) throw new Error(`devices_list_failed: ${error.message}`);
    return { status: "ok", data: rows };
  });

// ---------------------------------------------------------------------------
// 5. Devices — trust toggle
// ---------------------------------------------------------------------------
export const idDeviceTrust = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, device_id: uuid, trusted: z.boolean(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "device", capability: "trust",
      user_id: userId, company_id: data.company_id,
    });
    const { error } = await supabase.from("auth_devices")
      .update({ trusted: data.trusted }).eq("id", data.device_id);
    if (error) throw new Error(`device_trust_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.device", action: data.trusted ? "trust" : "untrust",
      entity_type: "auth_devices", entity_id: data.device_id,
      company_id: data.company_id, severity: "notice",
    });
    return { status: "updated", entity_id: data.device_id };
  });

// ---------------------------------------------------------------------------
// 6. Devices — revoke
// ---------------------------------------------------------------------------
export const idDeviceRevoke = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, device_id: uuid,
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "device", capability: "revoke",
      user_id: userId, company_id: data.company_id,
    });
    const { error } = await supabase.from("auth_devices")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.device_id);
    if (error) throw new Error(`device_revoke_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.device", action: "revoke",
      entity_type: "auth_devices", entity_id: data.device_id,
      company_id: data.company_id, severity: "warning",
    });
    return { status: "revoked", entity_id: data.device_id };
  });

// ---------------------------------------------------------------------------
// 7. Role assign (user_roles enum) — privileged roles need approval
// ---------------------------------------------------------------------------
export const idRoleAssign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid, role: AppRole,
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "role", capability: "assign",
      user_id: userId, company_id: data.company_id,
      summary: `${data.role} → user`,
    });
    if (data.role === "founder" || data.role === "admin") {
      const a = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "identity.role_assign",
          entity_id: data.user_id,
          title: `Grant ${data.role} role`,
          reason: "privileged_role",
          metadata: { user_id: data.user_id, role: data.role },
        } as never,
      });
      return { status: "pending_approval", approval_id: (a as { id: string }).id };
    }
    const { data: row, error } = await supabase.from("user_roles")
      .insert({ user_id: data.user_id, role: data.role })
      .select("id").single();
    if (error) throw new Error(`role_assign_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.role", action: "assign",
      entity_type: "user_roles", entity_id: row.id,
      company_id: data.company_id, severity: "notice",
      after: { user_id: data.user_id, role: data.role },
    });
    return { status: "granted", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 8. Role revoke
// ---------------------------------------------------------------------------
export const idRoleRevoke = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid, role: AppRole,
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "role", capability: "revoke",
      user_id: userId, company_id: data.company_id,
    });
    const { error } = await supabase.from("user_roles")
      .delete().eq("user_id", data.user_id).eq("role", data.role);
    if (error) throw new Error(`role_revoke_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.role", action: "revoke",
      entity_type: "user_roles", entity_id: data.user_id,
      company_id: data.company_id, severity: "warning",
      before: { user_id: data.user_id, role: data.role },
    });
    return { status: "revoked", entity_id: data.user_id };
  });

// ---------------------------------------------------------------------------
// 9. Scoped role grant (role_assignments)
// ---------------------------------------------------------------------------
export const idRoleAssignmentGrant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid, role_id: uuid,
    scope_type: ScopeType, scope_id: uuid.nullable().optional(),
    expires_at: z.string().datetime().nullable().optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "role_assignment", capability: "grant",
      user_id: userId, company_id: data.company_id,
    });
    const { data: row, error } = await supabase.from("role_assignments")
      .insert({
        user_id: data.user_id, role_id: data.role_id,
        scope_type: data.scope_type as Database["public"]["Enums"]["scope_type"],
        scope_id: data.scope_id ?? null,
        expires_at: data.expires_at ?? null,
        granted_by: userId,
      }).select("id").single();
    if (error) throw new Error(`role_grant_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.role_assignment", action: "grant",
      entity_type: "role_assignments", entity_id: row.id,
      company_id: data.company_id, severity: "notice", after: row,
    });
    return { status: "granted", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 10. Scoped role revoke
// ---------------------------------------------------------------------------
export const idRoleAssignmentRevoke = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, assignment_id: uuid,
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "role_assignment", capability: "revoke",
      user_id: userId, company_id: data.company_id,
    });
    const { error } = await supabase.from("role_assignments")
      .delete().eq("id", data.assignment_id);
    if (error) throw new Error(`role_revoke_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.role_assignment", action: "revoke",
      entity_type: "role_assignments", entity_id: data.assignment_id,
      company_id: data.company_id, severity: "warning",
    });
    return { status: "revoked", entity_id: data.assignment_id };
  });

// ---------------------------------------------------------------------------
// 11. Access review — user + scope
// ---------------------------------------------------------------------------
export const idAccessReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid,
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "access", capability: "review",
      user_id: userId, company_id: data.company_id,
    });
    const [ur, ra] = await Promise.all([
      supabase.from("user_roles").select("role,created_at").eq("user_id", data.user_id),
      supabase.from("role_assignments")
        .select("id,role_id,scope_type,scope_id,granted_at,expires_at")
        .eq("user_id", data.user_id),
    ]);
    if (ur.error) throw new Error(ur.error.message);
    if (ra.error) throw new Error(ra.error.message);
    return { status: "ok", data: { user_roles: ur.data, role_assignments: ra.data } };
  });

// ---------------------------------------------------------------------------
// 12. Security event — log
// ---------------------------------------------------------------------------
export const idSecurityEventLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid, alert_type: z.string().min(1).max(80),
    message: z.string().min(1).max(500),
    severity: z.enum(["info", "notice", "warning", "critical"]).default("warning"),
    device_id: uuid.nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "security_event", capability: "log",
      user_id: userId, company_id: data.company_id,
    });
    const { data: row, error } = await supabase.from("auth_security_alerts")
      .insert({
        user_id: data.user_id, alert_type: data.alert_type,
        message: data.message, severity: data.severity,
        device_id: data.device_id ?? null,
        metadata: (data.metadata ?? {}) as never,
      }).select("id").single();
    if (error) throw new Error(`security_event_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.security", action: "event",
      entity_type: "auth_security_alerts", entity_id: row.id,
      company_id: data.company_id, severity: data.severity,
    });
    return { status: "recorded", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 13. Security event — acknowledge
// ---------------------------------------------------------------------------
export const idSecurityEventAck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, alert_id: uuid,
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "security_event", capability: "ack",
      user_id: userId, company_id: data.company_id,
    });
    const { error } = await supabase.from("auth_security_alerts")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", data.alert_id);
    if (error) throw new Error(`security_ack_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.security", action: "ack",
      entity_type: "auth_security_alerts", entity_id: data.alert_id,
      company_id: data.company_id, severity: "info",
    });
    return { status: "acknowledged", entity_id: data.alert_id };
  });

// ---------------------------------------------------------------------------
// 14. Security policy — upsert (scoped)
// ---------------------------------------------------------------------------
export const idSecurityPolicySet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid,
    scope_type: z.string().min(1), scope_id: uuid.nullable().optional(),
    idle_timeout_minutes: z.number().int().min(1).max(1440).optional(),
    absolute_timeout_hours: z.number().int().min(1).max(720).optional(),
    max_active_sessions: z.number().int().min(1).max(100).optional(),
    require_mfa: z.boolean().optional(),
    require_trusted_device: z.boolean().optional(),
    allowed_providers: z.array(z.string()).optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "policy", capability: "set",
      user_id: userId, company_id: data.company_id,
    });
    const patch: Database["public"]["Tables"]["auth_session_policies"]["Insert"] = {
      scope_type: data.scope_type, scope_id: data.scope_id ?? null,
      ...(data.idle_timeout_minutes !== undefined && { idle_timeout_minutes: data.idle_timeout_minutes }),
      ...(data.absolute_timeout_hours !== undefined && { absolute_timeout_hours: data.absolute_timeout_hours }),
      ...(data.max_active_sessions !== undefined && { max_active_sessions: data.max_active_sessions }),
      ...(data.require_mfa !== undefined && { require_mfa: data.require_mfa }),
      ...(data.require_trusted_device !== undefined && { require_trusted_device: data.require_trusted_device }),
      ...(data.allowed_providers !== undefined && { allowed_providers: data.allowed_providers }),
    };
    const { data: row, error } = await supabase.from("auth_session_policies")
      .upsert(patch).select("id").single();
    if (error) throw new Error(`policy_set_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "identity.policy", action: "set",
      entity_type: "auth_session_policies", entity_id: row.id,
      company_id: data.company_id, severity: "notice", after: patch,
    });
    return { status: "updated", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 15. Login history
// ---------------------------------------------------------------------------
export const idLoginHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid.optional(),
    limit: z.number().int().min(1).max(500).default(100),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "login_history", capability: "read",
      user_id: userId, company_id: data.company_id,
    });
    const q = supabase.from("auth_login_history")
      .select("id,user_id,event_type,provider,success,created_at,device_id")
      .order("created_at", { ascending: false }).limit(data.limit);
    const { data: rows, error } = data.user_id
      ? await q.eq("user_id", data.user_id) : await q;
    if (error) throw new Error(`login_history_failed: ${error.message}`);
    return { status: "ok", data: rows };
  });

// ---------------------------------------------------------------------------
// 16. Account lock (emergency)
// ---------------------------------------------------------------------------
export const idAccountLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid, lock: z.boolean(),
    reason: z.string().max(240).optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "account", capability: data.lock ? "lock" : "unlock",
      user_id: userId, company_id: data.company_id,
    });
    const { error } = await supabase.from("auth_devices")
      .update({ emergency_locked: data.lock }).eq("user_id", data.user_id);
    if (error) throw new Error(`account_lock_failed: ${error.message}`);
    if (data.lock) {
      await supabase.from("auth_sessions_meta")
        .update({ ended_at: new Date().toISOString(), end_reason: "account_locked" })
        .eq("user_id", data.user_id).is("ended_at", null);
    }
    await writeCanonicalAudit(supabase, {
      category: "identity.account", action: data.lock ? "lock" : "unlock",
      entity_type: "user", entity_id: data.user_id,
      company_id: data.company_id, severity: data.lock ? "critical" : "notice",
      metadata: { reason: data.reason ?? null },
    });
    return { status: data.lock ? "revoked" : "updated", entity_id: data.user_id };
  });

// ---------------------------------------------------------------------------
// 17. Permission check (RPC has_role)
// ---------------------------------------------------------------------------
export const idPermissionCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, user_id: uuid, role: AppRole,
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "permission", capability: "check",
      user_id: userId, company_id: data.company_id,
    });
    const { data: ok, error } = await supabase.rpc("has_role", {
      _user_id: data.user_id, _role: data.role,
    });
    if (error) throw new Error(`permission_check_failed: ${error.message}`);
    return { status: "ok", data: { has_role: !!ok } };
  });

// ---------------------------------------------------------------------------
// 18. Security analytics (aggregates)
// ---------------------------------------------------------------------------
export const idSecurityAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ company_id: uuid }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "analytics", capability: "read",
      user_id: userId, company_id: data.company_id,
    });
    const head = { count: "exact" as const, head: true };
    const since24h = new Date(Date.now() - 24 * 3600e3).toISOString();
    const [activeSessions, lockedDevices, openAlerts, criticalAlerts, loginsFailed24h, loginsOk24h] = await Promise.all([
      supabase.from("auth_sessions_meta").select("id", head).is("ended_at", null),
      supabase.from("auth_devices").select("id", head).eq("emergency_locked", true),
      supabase.from("auth_security_alerts").select("id", head).is("acknowledged_at", null),
      supabase.from("auth_security_alerts").select("id", head).eq("severity", "critical").is("acknowledged_at", null),
      supabase.from("auth_login_history").select("id", head).eq("success", false).gte("created_at", since24h),
      supabase.from("auth_login_history").select("id", head).eq("success", true).gte("created_at", since24h),
    ]);
    return {
      status: "ok",
      data: {
        active_sessions: activeSessions.count ?? 0,
        locked_devices: lockedDevices.count ?? 0,
        open_alerts: openAlerts.count ?? 0,
        critical_alerts: criticalAlerts.count ?? 0,
        logins_failed_24h: loginsFailed24h.count ?? 0,
        logins_ok_24h: loginsOk24h.count ?? 0,
      },
    };
  });

// ---------------------------------------------------------------------------
// 19. Identity health (Mission Control feed)
// ---------------------------------------------------------------------------
export const idIdentityHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ company_id: uuid }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "identity", module: "health", capability: "read",
      user_id: userId, company_id: data.company_id,
    });
    const head = { count: "exact" as const, head: true };
    const [roles, assignments, policies, devices, sessions] = await Promise.all([
      supabase.from("user_roles").select("id", head),
      supabase.from("role_assignments").select("id", head),
      supabase.from("auth_session_policies").select("id", head),
      supabase.from("auth_devices").select("id", head).is("revoked_at", null),
      supabase.from("auth_sessions_meta").select("id", head).is("ended_at", null),
    ]);
    return {
      status: "ok",
      data: {
        user_roles: roles.count ?? 0,
        role_assignments: assignments.count ?? 0,
        session_policies: policies.count ?? 0,
        active_devices: devices.count ?? 0,
        active_sessions: sessions.count ?? 0,
        pipeline: "canonical.v1",
        domain: "identity",
      },
    };
  });
