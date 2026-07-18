/**
 * R114 — HAPPY ID + Session/Device Manager + Login History + Security Alerts.
 *
 * Extends existing Supabase auth (never replaces). Every fn goes through
 * requireSupabaseAuth so RLS scopes rows to the caller.
 *
 * Canonical owner per R111 §4 for auth extension. Do NOT fork.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Devices ----------
export const listMyDevices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("auth_devices")
      .select("id, device_fingerprint, device_name, device_type, os, browser, location_country, location_region, trusted, first_seen_at, last_seen_at, revoked_at")
      .eq("user_id", context.userId)
      .order("last_seen_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const registerDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      device_fingerprint: z.string().min(4).max(200),
      device_name: z.string().max(120).optional(),
      device_type: z.string().max(40).optional(),
      os: z.string().max(80).optional(),
      browser: z.string().max(80).optional(),
      ip_hash: z.string().max(128).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("auth_devices")
      .upsert({
        user_id: context.userId,
        device_fingerprint: data.device_fingerprint,
        device_name: data.device_name ?? null,
        device_type: data.device_type ?? null,
        os: data.os ?? null,
        browser: data.browser ?? null,
        ip_hash: data.ip_hash ?? null,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "user_id,device_fingerprint" })
      .select("id, trusted")
      .single();
    if (error) throw error;
    return row;
  });

export const trustDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ device_id: z.string().uuid(), trusted: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("auth_devices")
      .update({ trusted: data.trusted })
      .eq("id", data.device_id)
      .eq("user_id", context.userId);
    if (error) throw error;
    await context.supabase.from("auth_security_alerts").insert({
      user_id: context.userId,
      alert_type: data.trusted ? "trusted_device_added" : "trusted_device_removed",
      severity: "info",
      message: data.trusted ? "Device marked as trusted." : "Device trust revoked.",
      device_id: data.device_id,
    });
    return { ok: true };
  });

export const revokeDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ device_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { error } = await context.supabase
      .from("auth_devices")
      .update({ revoked_at: now, trusted: false })
      .eq("id", data.device_id)
      .eq("user_id", context.userId);
    if (error) throw error;
    // End any active sessions on this device
    await context.supabase
      .from("auth_sessions_meta")
      .update({ ended_at: now, end_reason: "device_revoked" })
      .eq("device_id", data.device_id)
      .eq("user_id", context.userId)
      .is("ended_at", null);
    return { ok: true };
  });

// ---------- Sessions ----------
export const listMySessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("auth_sessions_meta")
      .select("id, session_key, device_id, user_agent, started_at, last_active_at, ended_at, end_reason")
      .eq("user_id", context.userId)
      .order("last_active_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const registerSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      session_key: z.string().min(8),
      device_id: z.string().uuid().optional(),
      user_agent: z.string().max(400).optional(),
      ip_hash: z.string().max(128).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("auth_sessions_meta")
      .upsert({
        user_id: context.userId,
        session_key: data.session_key,
        device_id: data.device_id ?? null,
        user_agent: data.user_agent ?? null,
        ip_hash: data.ip_hash ?? null,
        last_active_at: new Date().toISOString(),
      }, { onConflict: "user_id,session_key" })
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const remoteLogout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ session_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { error } = await context.supabase
      .from("auth_sessions_meta")
      .update({ ended_at: now, end_reason: "remote_logout" })
      .eq("id", data.session_id)
      .eq("user_id", context.userId);
    if (error) throw error;
    await context.supabase.from("auth_security_alerts").insert({
      user_id: context.userId,
      alert_type: "remote_logout",
      severity: "warning",
      message: "A session was signed out remotely.",
    });
    await context.supabase.from("auth_login_history").insert({
      user_id: context.userId,
      event_type: "remote_logout",
      success: true,
    });
    return { ok: true };
  });

export const remoteLogoutAllOthers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ keep_session_key: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { error, count } = await context.supabase
      .from("auth_sessions_meta")
      .update({ ended_at: now, end_reason: "remote_logout_all" }, { count: "exact" })
      .eq("user_id", context.userId)
      .neq("session_key", data.keep_session_key)
      .is("ended_at", null);
    if (error) throw error;
    return { ok: true, ended: count ?? 0 };
  });

// ---------- Login History ----------
export const listMyLoginHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("auth_login_history")
      .select("id, event_type, provider, device_id, user_agent, success, created_at, metadata")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const recordLoginEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      event_type: z.enum(["signin","signout","signup","failed","magic_link","oauth","otp","passkey","sso","token_refresh","session_expired","remote_logout"]),
      provider: z.string().max(40).optional(),
      device_id: z.string().uuid().optional(),
      user_agent: z.string().max(400).optional(),
      success: z.boolean().default(true),
      metadata: z.record(z.unknown()).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("auth_login_history").insert({
      user_id: context.userId,
      event_type: data.event_type,
      provider: data.provider ?? null,
      device_id: data.device_id ?? null,
      user_agent: data.user_agent ?? null,
      success: data.success,
      metadata: data.metadata ?? {},
    });
    if (error) throw error;
    return { ok: true };
  });

// ---------- Security Alerts ----------
export const listMySecurityAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("auth_security_alerts")
      .select("id, alert_type, severity, message, device_id, acknowledged_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const acknowledgeSecurityAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ alert_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("auth_security_alerts")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", data.alert_id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------- Session Policies ----------
export const getEffectiveSessionPolicy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Precedence: user > company > platform
    const { data, error } = await context.supabase
      .from("auth_session_policies")
      .select("scope_type, scope_id, max_active_sessions, require_trusted_device, idle_timeout_minutes, absolute_timeout_hours, require_mfa, allowed_providers");
    if (error) throw error;
    const rows = data ?? [];
    const user = rows.find((r) => r.scope_type === "user" && r.scope_id === context.userId);
    const company = rows.find((r) => r.scope_type === "company");
    const platform = rows.find((r) => r.scope_type === "platform");
    return user ?? company ?? platform ?? {
      scope_type: "platform" as const,
      scope_id: null,
      max_active_sessions: 1,
      require_trusted_device: false,
      idle_timeout_minutes: 43200,
      absolute_timeout_hours: 720,
      require_mfa: false,
      allowed_providers: ["email","google","apple","passkey","otp","sso"],
    };
  });
