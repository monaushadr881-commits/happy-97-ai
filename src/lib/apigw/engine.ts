// R32 HAPPY Enterprise API Gateway — real implementation
// Registry, keys, OAuth, rate limiting, usage logging, webhooks (in/out), connectors.
// Never bypasses existing business runtimes.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

export type ApiKind = "public" | "private" | "internal" | "partner" | "admin" | "founder";
export type AuthMethod = "bearer" | "api_key" | "oauth" | "service_account";
export type WebhookStatus = "pending" | "delivered" | "failed" | "dead_letter" | "retrying";

// ---------- crypto helpers (Worker-safe Web Crypto) ----------
async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// =====================================================================
// API REGISTRY
// =====================================================================
export interface ApiRegisterInput {
  company_id?: string | null;
  slug: string;
  name: string;
  description?: string;
  version?: string;
  kind?: ApiKind;
  base_path: string;
  default_rate_limit_per_min?: number;
  requires_auth?: boolean;
  auth_methods?: AuthMethod[];
  scopes?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export async function apiRegister(sb: SB, userId: string, input: ApiRegisterInput) {
  const row = {
    company_id: input.company_id ?? null,
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    version: input.version ?? "v1",
    kind: input.kind ?? "private",
    base_path: input.base_path,
    default_rate_limit_per_min: input.default_rate_limit_per_min ?? 120,
    requires_auth: input.requires_auth ?? true,
    auth_methods: input.auth_methods ?? ["bearer", "api_key"],
    scopes: input.scopes ?? [],
    tags: input.tags ?? [],
    metadata: (input.metadata ?? {}) as never,
    created_by: userId,
  };
  const { data, error } = await sb.from("apigw_api_registry" as never).upsert(row as never, { onConflict: "company_id,slug,version" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function apiList(sb: SB, _userId: string, opts: { company_id?: string; kind?: ApiKind; status?: string } = {}) {
  let q = sb.from("apigw_api_registry" as never).select("*").order("created_at", { ascending: false });
  if (opts.company_id) q = q.eq("company_id", opts.company_id);
  if (opts.kind) q = q.eq("kind", opts.kind);
  if (opts.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function apiGet(sb: SB, _userId: string, id: string) {
  const { data, error } = await sb.from("apigw_api_registry" as never).select("*").eq("id", id).single();
  if (error) throw error;
  const routes = await sb.from("apigw_api_routes" as never).select("*").eq("api_id", id).order("path");
  return { api: data, routes: routes.data ?? [] };
}

export async function apiDeprecate(sb: SB, _userId: string, id: string, successor_id?: string) {
  const { data, error } = await sb.from("apigw_api_registry" as never).update({
    status: "deprecated",
    deprecated_at: new Date().toISOString(),
    successor_id: successor_id ?? null,
  } as never).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

// ---------- routes ----------
export interface RouteInput {
  api_id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
  path: string;
  summary?: string;
  description?: string;
  request_schema?: Record<string, unknown>;
  response_schema?: Record<string, unknown>;
  example_request?: Record<string, unknown>;
  example_response?: Record<string, unknown>;
  required_scopes?: string[];
  rate_limit_per_min?: number;
  runtime?: string;
  runtime_action?: string;
  cacheable?: boolean;
}

export async function routeUpsert(sb: SB, _userId: string, input: RouteInput) {
  const row = {
    api_id: input.api_id,
    method: input.method,
    path: input.path,
    summary: input.summary ?? null,
    description: input.description ?? null,
    request_schema: (input.request_schema ?? {}) as never,
    response_schema: (input.response_schema ?? {}) as never,
    example_request: (input.example_request ?? {}) as never,
    example_response: (input.example_response ?? {}) as never,
    required_scopes: input.required_scopes ?? [],
    rate_limit_per_min: input.rate_limit_per_min ?? null,
    runtime: input.runtime ?? null,
    runtime_action: input.runtime_action ?? null,
    cacheable: input.cacheable ?? false,
  };
  const { data, error } = await sb.from("apigw_api_routes" as never).upsert(row as never, { onConflict: "api_id,method,path" }).select("*").single();
  if (error) throw error;
  return data;
}

// =====================================================================
// API KEYS
// =====================================================================
export interface KeyIssueInput {
  company_id: string;
  name: string;
  scopes?: string[];
  allowed_apis?: string[];
  rate_limit_per_min?: number;
  environment?: "live" | "test" | "sandbox";
  expires_at?: string | null;
  rotated_from?: string | null;
}

export async function apiKeyIssue(sb: SB, userId: string, input: KeyIssueInput) {
  const env = input.environment ?? "live";
  const raw = `hpx_${env === "live" ? "live" : env === "test" ? "test" : "sbx"}_${randomToken(24)}`;
  const key_hash = await sha256Hex(raw);
  const key_prefix = raw.slice(0, 12);
  const key_last4 = raw.slice(-4);
  const row = {
    company_id: input.company_id,
    owner_user_id: userId,
    name: input.name,
    key_prefix,
    key_hash,
    key_last4,
    scopes: input.scopes ?? [],
    allowed_apis: input.allowed_apis ?? [],
    rate_limit_per_min: input.rate_limit_per_min ?? 120,
    environment: env,
    expires_at: input.expires_at ?? null,
    rotated_from: input.rotated_from ?? null,
  };
  const { data, error } = await sb.from("apigw_keys" as never).insert(row as never).select("*").single();
  if (error) throw error;
  // Only returned once. Client MUST persist immediately.
  return { key: raw, record: data };
}

export async function apiKeyRevoke(sb: SB, _userId: string, id: string, reason?: string) {
  const { data, error } = await sb.from("apigw_keys" as never).update({
    revoked_at: new Date().toISOString(),
    revoked_reason: reason ?? "manual_revoke",
  } as never).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function apiKeyRotate(sb: SB, userId: string, id: string) {
  const { data: old, error: e1 } = await sb.from("apigw_keys" as never).select("*").eq("id", id).single();
  if (e1) throw e1;
  const o = old as { company_id: string; name: string; scopes: string[]; allowed_apis: string[]; rate_limit_per_min: number; environment: "live" | "test" | "sandbox"; expires_at: string | null };
  const issued = await apiKeyIssue(sb, userId, {
    company_id: o.company_id,
    name: `${o.name} (rotated)`,
    scopes: o.scopes,
    allowed_apis: o.allowed_apis,
    rate_limit_per_min: o.rate_limit_per_min,
    environment: o.environment,
    expires_at: o.expires_at,
    rotated_from: id,
  });
  await apiKeyRevoke(sb, userId, id, "rotated");
  return issued;
}

export async function apiKeyList(sb: SB, _userId: string, opts: { company_id: string; include_revoked?: boolean }) {
  let q = sb.from("apigw_keys" as never).select("*").eq("company_id", opts.company_id).order("created_at", { ascending: false });
  if (!opts.include_revoked) q = q.is("revoked_at", null);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((k: Record<string, unknown>) => ({ ...k, key_hash: undefined })); // never leak hash
}

// ---------- verification (used server-side by gateway routes) ----------
export interface VerifyResult {
  ok: boolean;
  reason?: "unknown_key" | "revoked" | "expired" | "rate_limited" | "scope_missing" | "api_forbidden";
  key?: Record<string, unknown>;
}

export async function apiKeyVerify(sb: SB, raw: string, opts: { required_scope?: string; api_id?: string } = {}): Promise<VerifyResult> {
  const hash = await sha256Hex(raw);
  const { data, error } = await sb.from("apigw_keys" as never).select("*").eq("key_hash", hash).maybeSingle();
  if (error || !data) return { ok: false, reason: "unknown_key" };
  const k = data as {
    id: string;
    revoked_at: string | null;
    expires_at: string | null;
    scopes: string[];
    allowed_apis: string[];
    rate_limit_per_min: number;
  };
  if (k.revoked_at) return { ok: false, reason: "revoked", key: data as Record<string, unknown> };
  if (k.expires_at && new Date(k.expires_at) < new Date()) return { ok: false, reason: "expired", key: data as Record<string, unknown> };
  if (opts.required_scope && !k.scopes.includes(opts.required_scope) && !k.scopes.includes("*")) {
    return { ok: false, reason: "scope_missing", key: data as Record<string, unknown> };
  }
  if (opts.api_id && k.allowed_apis.length > 0 && !k.allowed_apis.includes(opts.api_id)) {
    return { ok: false, reason: "api_forbidden", key: data as Record<string, unknown> };
  }
  const rl = await rateLimitCheck(sb, `key:${k.id}`, k.rate_limit_per_min);
  if (!rl.ok) return { ok: false, reason: "rate_limited", key: data as Record<string, unknown> };
  await sb.from("apigw_keys" as never).update({ last_used_at: new Date().toISOString() } as never).eq("id", k.id);
  return { ok: true, key: data as Record<string, unknown> };
}

// =====================================================================
// RATE LIMITING (fixed 1-minute window)
// =====================================================================
export async function rateLimitCheck(sb: SB, scopeKey: string, limitPerMin: number): Promise<{ ok: boolean; remaining: number; reset_at: string }> {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setSeconds(0, 0);
  const reset = new Date(windowStart.getTime() + 60_000).toISOString();
  const { data: existing } = await sb.from("apigw_rate_counters" as never)
    .select("*").eq("scope_key", scopeKey).eq("window_start", windowStart.toISOString()).maybeSingle();
  if (!existing) {
    await sb.from("apigw_rate_counters" as never).insert({
      scope_key: scopeKey, window_start: windowStart.toISOString(), count: 1, limit_per_min: limitPerMin,
    } as never);
    return { ok: true, remaining: Math.max(0, limitPerMin - 1), reset_at: reset };
  }
  const e = existing as { id: string; count: number };
  if (e.count >= limitPerMin) return { ok: false, remaining: 0, reset_at: reset };
  await sb.from("apigw_rate_counters" as never).update({ count: e.count + 1 } as never).eq("id", e.id);
  return { ok: true, remaining: Math.max(0, limitPerMin - (e.count + 1)), reset_at: reset };
}

// =====================================================================
// USAGE LOGGING
// =====================================================================
export interface UsageLogInput {
  company_id?: string | null;
  api_id?: string | null;
  route_id?: string | null;
  api_key_id?: string | null;
  user_id?: string | null;
  auth_method?: AuthMethod;
  method: string;
  path: string;
  status_code: number;
  latency_ms?: number;
  request_bytes?: number;
  response_bytes?: number;
  ip?: string | null;
  user_agent?: string | null;
  error_code?: string | null;
  metadata?: Record<string, unknown>;
}

export async function usageLog(sb: SB, input: UsageLogInput) {
  const row = {
    company_id: input.company_id ?? null,
    api_id: input.api_id ?? null,
    route_id: input.route_id ?? null,
    api_key_id: input.api_key_id ?? null,
    user_id: input.user_id ?? null,
    auth_method: input.auth_method ?? null,
    method: input.method,
    path: input.path,
    status_code: input.status_code,
    latency_ms: input.latency_ms ?? 0,
    request_bytes: input.request_bytes ?? 0,
    response_bytes: input.response_bytes ?? 0,
    ip: input.ip ?? null,
    user_agent: input.user_agent ?? null,
    error_code: input.error_code ?? null,
    metadata: (input.metadata ?? {}) as never,
  };
  const { error } = await sb.from("apigw_usage_log" as never).insert(row as never);
  if (error) throw error;
}

export async function usageStats(sb: SB, _userId: string, opts: { company_id: string; window_min?: number }) {
  const since = new Date(Date.now() - (opts.window_min ?? 60) * 60_000).toISOString();
  const { data, error } = await sb.from("apigw_usage_log" as never)
    .select("status_code, latency_ms, api_id, api_key_id")
    .eq("company_id", opts.company_id)
    .gte("created_at", since);
  if (error) throw error;
  const rows = (data ?? []) as Array<{ status_code: number; latency_ms: number; api_id: string | null; api_key_id: string | null }>;
  const total = rows.length;
  const errors = rows.filter((r) => r.status_code >= 400).length;
  const p50 = percentile(rows.map((r) => r.latency_ms), 0.5);
  const p95 = percentile(rows.map((r) => r.latency_ms), 0.95);
  const byApi: Record<string, number> = {};
  const byKey: Record<string, number> = {};
  for (const r of rows) {
    if (r.api_id) byApi[r.api_id] = (byApi[r.api_id] ?? 0) + 1;
    if (r.api_key_id) byKey[r.api_key_id] = (byKey[r.api_key_id] ?? 0) + 1;
  }
  return {
    window_min: opts.window_min ?? 60,
    total,
    errors,
    error_rate: total ? errors / total : 0,
    latency_p50: p50,
    latency_p95: p95,
    top_apis: topN(byApi, 5),
    top_consumers: topN(byKey, 5),
  };
}

function percentile(nums: number[], p: number): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}
function topN(map: Record<string, number>, n: number) {
  return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, n).map(([id, count]) => ({ id, count }));
}

// =====================================================================
// WEBHOOKS — OUTGOING
// =====================================================================
export interface WebhookEndpointInput {
  company_id: string;
  name: string;
  url: string;
  event_types: string[];
  max_retries?: number;
  backoff?: "linear" | "exponential";
  timeout_ms?: number;
  version?: string;
}

export async function webhookEndpointCreate(sb: SB, userId: string, input: WebhookEndpointInput) {
  const secret = randomToken(32);
  const secret_hash = await sha256Hex(secret);
  const row = {
    company_id: input.company_id,
    name: input.name,
    url: input.url,
    event_types: input.event_types,
    secret_hash,
    secret_last4: secret.slice(-4),
    max_retries: input.max_retries ?? 5,
    backoff: input.backoff ?? "exponential",
    timeout_ms: input.timeout_ms ?? 10_000,
    version: input.version ?? "v1",
    created_by: userId,
  };
  const { data, error } = await sb.from("apigw_webhook_endpoints" as never).insert(row as never).select("*").single();
  if (error) throw error;
  return { endpoint: data, secret }; // secret shown once
}

export async function webhookEndpointList(sb: SB, _userId: string, opts: { company_id: string }) {
  const { data, error } = await sb.from("apigw_webhook_endpoints" as never)
    .select("*").eq("company_id", opts.company_id).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function webhookEndpointToggle(sb: SB, _userId: string, id: string, active: boolean, reason?: string) {
  const { data, error } = await sb.from("apigw_webhook_endpoints" as never).update({
    active, disabled_reason: active ? null : (reason ?? null),
  } as never).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

// Enqueue a delivery. Idempotent per (endpoint_id, event_id).
export async function webhookEmit(sb: SB, opts: {
  company_id: string;
  event_type: string;
  event_id?: string;
  payload: Record<string, unknown>;
}) {
  const { data: endpoints, error } = await sb.from("apigw_webhook_endpoints" as never)
    .select("*").eq("company_id", opts.company_id).eq("active", true);
  if (error) throw error;
  const eps = (endpoints ?? []) as Array<{ id: string; event_types: string[]; max_retries: number }>;
  const targets = eps.filter((e) => e.event_types.length === 0 || e.event_types.includes(opts.event_type) || e.event_types.includes("*"));
  const event_id = opts.event_id ?? randomToken(12);
  const enqueued: string[] = [];
  for (const ep of targets) {
    const body = JSON.stringify({ event: opts.event_type, event_id, data: opts.payload });
    // Sign with a stable per-endpoint canonical string; secret is only known to the subscriber,
    // but we produce a delivery-side signature using hash(secret_hash || body) — the subscriber
    // rotates their secret via the endpoint create/rotate flow.
    const { data: epFull } = await sb.from("apigw_webhook_endpoints" as never).select("secret_hash").eq("id", ep.id).single();
    const secret_hash = (epFull as unknown as { secret_hash: string } | null)?.secret_hash ?? "";
    const signature = await hmacSha256Hex(secret_hash, `${event_id}.${body}`);
    const row = {
      endpoint_id: ep.id,
      company_id: opts.company_id,
      event_type: opts.event_type,
      event_id,
      payload: opts.payload as never,
      signature,
      max_attempts: ep.max_retries,
      status: "pending",
    };
    const { error: e2 } = await sb.from("apigw_webhook_deliveries" as never)
      .insert(row as never).select("id").single();
    if (!e2) enqueued.push(ep.id);
  }
  return { event_id, enqueued: enqueued.length };
}

// Process pending deliveries; returns per-delivery result.
export async function webhookDispatchDue(sb: SB, opts: { limit?: number } = {}) {
  const nowIso = new Date().toISOString();
  const { data, error } = await sb.from("apigw_webhook_deliveries" as never)
    .select("*").in("status", ["pending", "retrying"]).lte("next_attempt_at", nowIso)
    .order("next_attempt_at").limit(opts.limit ?? 25);
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string; endpoint_id: string; event_type: string; event_id: string;
    payload: Record<string, unknown>; signature: string; attempt: number; max_attempts: number;
  }>;
  const results: Array<{ id: string; status: WebhookStatus; code?: number; error?: string }> = [];
  for (const d of rows) {
    const { data: ep } = await sb.from("apigw_webhook_endpoints" as never)
      .select("id,url,timeout_ms,backoff,active").eq("id", d.endpoint_id).single();
    const e = ep as { url: string; timeout_ms: number; backoff: string; active: boolean } | null;
    if (!e || !e.active) {
      await sb.from("apigw_webhook_deliveries" as never).update({
        status: "dead_letter", last_error: "endpoint_inactive",
      } as never).eq("id", d.id);
      results.push({ id: d.id, status: "dead_letter", error: "endpoint_inactive" });
      continue;
    }
    const attempt = d.attempt + 1;
    const body = JSON.stringify({ event: d.event_type, event_id: d.event_id, data: d.payload });
    let code = 0;
    let responseText = "";
    let error_text: string | null = null;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), e.timeout_ms);
      const res = await fetch(e.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-happy-event": d.event_type,
          "x-happy-event-id": d.event_id,
          "x-happy-signature": d.signature,
          "x-happy-attempt": String(attempt),
        },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(t);
      code = res.status;
      responseText = (await res.text()).slice(0, 2048);
    } catch (err) {
      error_text = String((err as Error).message ?? err);
    }
    const success = code >= 200 && code < 300;
    if (success) {
      await sb.from("apigw_webhook_deliveries" as never).update({
        status: "delivered", attempt, last_status_code: code, last_response: responseText, delivered_at: new Date().toISOString(),
      } as never).eq("id", d.id);
      await sb.from("apigw_webhook_endpoints" as never).update({
        last_success_at: new Date().toISOString(), failure_streak: 0,
      } as never).eq("id", d.endpoint_id);
      results.push({ id: d.id, status: "delivered", code });
    } else if (attempt >= d.max_attempts) {
      await sb.from("apigw_webhook_deliveries" as never).update({
        status: "dead_letter", attempt, last_status_code: code || null, last_response: responseText, last_error: error_text,
      } as never).eq("id", d.id);
      results.push({ id: d.id, status: "dead_letter", code, error: error_text ?? undefined });
    } else {
      const backoff = e.backoff === "linear" ? attempt * 30_000 : Math.min(60 * 60_000, 15_000 * Math.pow(2, attempt));
      await sb.from("apigw_webhook_deliveries" as never).update({
        status: "retrying", attempt,
        next_attempt_at: new Date(Date.now() + backoff).toISOString(),
        last_status_code: code || null, last_response: responseText, last_error: error_text,
      } as never).eq("id", d.id);
      // no side effect on endpoint on retry
      results.push({ id: d.id, status: "retrying", code, error: error_text ?? undefined });
    }
  }
  return { processed: results.length, results };
}

export async function webhookReplay(sb: SB, _userId: string, delivery_id: string) {
  const { data, error } = await sb.from("apigw_webhook_deliveries" as never).update({
    status: "pending", next_attempt_at: new Date().toISOString(), attempt: 0, last_error: null,
  } as never).eq("id", delivery_id).select("*").single();
  if (error) throw error;
  return data;
}

// =====================================================================
// WEBHOOKS — INCOMING (replay-protected)
// =====================================================================
export async function webhookInboundRecord(sb: SB, input: {
  company_id?: string | null;
  source: string;
  event_type?: string;
  event_id: string;
  signature?: string | null;
  verified: boolean;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
}): Promise<{ status: "received" | "duplicate"; id?: string }> {
  const { data: existing } = await sb.from("apigw_webhook_inbound" as never)
    .select("id").eq("source", input.source).eq("event_id", input.event_id).maybeSingle();
  if (existing) return { status: "duplicate", id: (existing as { id: string }).id };
  const { data, error } = await sb.from("apigw_webhook_inbound" as never).insert({
    company_id: input.company_id ?? null,
    source: input.source,
    event_type: input.event_type ?? null,
    event_id: input.event_id,
    signature: input.signature ?? null,
    verified: input.verified,
    payload: input.payload as never,
    headers: (input.headers ?? {}) as never,
    status: input.verified ? "received" : "rejected",
  } as never).select("id").single();
  if (error) throw error;
  return { status: "received", id: (data as { id: string }).id };
}

export async function webhookInboundVerifyHmac(secret: string, signature: string, rawBody: string): Promise<boolean> {
  const expected = await hmacSha256Hex(secret, rawBody);
  return timingSafeEqualHex(expected, signature);
}

// =====================================================================
// CONNECTORS
// =====================================================================
export async function connectorsList(sb: SB, _userId: string) {
  const { data, error } = await sb.from("apigw_connectors" as never).select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function connectionEnable(sb: SB, userId: string, input: {
  company_id: string; connector_code: string; name: string;
  credentials_ref?: string; scopes?: string[]; config?: Record<string, unknown>;
}) {
  const { data: connector, error: e1 } = await sb.from("apigw_connectors" as never)
    .select("id").eq("code", input.connector_code).single();
  if (e1) throw e1;
  const row = {
    company_id: input.company_id,
    connector_id: (connector as { id: string }).id,
    name: input.name,
    credentials_ref: input.credentials_ref ?? null,
    scopes: input.scopes ?? [],
    config: (input.config ?? {}) as never,
    enabled: true,
    created_by: userId,
    status: "unknown",
  };
  const { data, error } = await sb.from("apigw_connections" as never)
    .upsert(row as never, { onConflict: "company_id,connector_id,name" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function connectionDisable(sb: SB, _userId: string, id: string) {
  const { data, error } = await sb.from("apigw_connections" as never).update({
    enabled: false, status: "disabled",
  } as never).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function connectionsList(sb: SB, _userId: string, opts: { company_id: string }) {
  const { data, error } = await sb.from("apigw_connections" as never)
    .select("*, connector:apigw_connectors(code,name,category,auth_kind,status)")
    .eq("company_id", opts.company_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Real health probe. Only performs a safe, side-effect-free check.
// Verifies presence of credentials_ref and reachability where a public health URL exists.
export async function connectionHealth(sb: SB, _userId: string, id: string) {
  const { data: c, error } = await sb.from("apigw_connections" as never)
    .select("*, connector:apigw_connectors(code,auth_kind,status)").eq("id", id).single();
  if (error) throw error;
  const conn = c as {
    id: string; enabled: boolean; credentials_ref: string | null; failure_streak: number;
    connector: { code: string; auth_kind: string; status: string };
  };
  let status: "healthy" | "degraded" | "error" | "disabled" = "healthy";
  let message = "ok";
  if (!conn.enabled) { status = "disabled"; message = "connection_disabled"; }
  else if (conn.connector.auth_kind !== "none" && !conn.credentials_ref) {
    status = "error"; message = "missing_credentials";
  } else {
    // Optional network probe for a documented public health endpoint per connector.
    const probes: Record<string, string> = {
      github: "https://api.github.com/",
      gitlab: "https://gitlab.com/api/v4/version",
      cloudflare: "https://api.cloudflare.com/client/v4/",
      netlify: "https://api.netlify.com/api/v1/",
      vercel: "https://api.vercel.com/",
      slack: "https://slack.com/api/api.test",
      discord: "https://discord.com/api/v10/gateway",
      stripe: "https://api.stripe.com/v1",
      paypal: "https://api-m.paypal.com/",
      digitalocean: "https://api.digitalocean.com/v2/",
    };
    const url = probes[conn.connector.code];
    if (url) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(url, { method: "GET", signal: ctrl.signal });
        clearTimeout(t);
        // We only assert the endpoint answered (any status is fine — auth may 401).
        if (!res || res.status >= 500) { status = "degraded"; message = `probe_${res?.status ?? "no_response"}`; }
      } catch (e) {
        status = "degraded"; message = `probe_error:${String((e as Error).message ?? e).slice(0, 120)}`;
      }
    }
  }
  const failure_streak = status === "healthy" ? 0 : conn.failure_streak + 1;
  const { data, error: e2 } = await sb.from("apigw_connections" as never).update({
    status, last_health_at: new Date().toISOString(), last_health_message: message, failure_streak,
  } as never).eq("id", id).select("*").single();
  if (e2) throw e2;
  return data;
}

// =====================================================================
// OPENAPI + SDK GENERATION
// =====================================================================
export async function openApiGenerate(sb: SB, _userId: string, api_id: string) {
  const { data: api, error } = await sb.from("apigw_api_registry" as never).select("*").eq("id", api_id).single();
  if (error) throw error;
  const { data: routes } = await sb.from("apigw_api_routes" as never).select("*").eq("api_id", api_id).eq("active", true);
  const a = api as { name: string; version: string; description: string | null; base_path: string; auth_methods: string[] };
  const paths: Record<string, Record<string, unknown>> = {};
  for (const r of (routes ?? []) as Array<{ method: string; path: string; summary: string | null; description: string | null; request_schema: unknown; response_schema: unknown; required_scopes: string[]; deprecated: boolean }>) {
    const key = r.path;
    paths[key] = paths[key] ?? {};
    paths[key][r.method.toLowerCase()] = {
      summary: r.summary ?? undefined,
      description: r.description ?? undefined,
      deprecated: r.deprecated || undefined,
      security: r.required_scopes.length ? [{ bearerAuth: r.required_scopes }] : [{ bearerAuth: [] }],
      requestBody: r.request_schema && Object.keys(r.request_schema as object).length
        ? { content: { "application/json": { schema: r.request_schema } } } : undefined,
      responses: { "200": { description: "OK", content: { "application/json": { schema: r.response_schema ?? {} } } } },
    };
  }
  return {
    openapi: "3.0.3",
    info: { title: a.name, version: a.version, description: a.description ?? undefined },
    servers: [{ url: a.base_path }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
        apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
      },
    },
    paths,
  };
}

export type SdkLang = "typescript" | "javascript" | "python" | "go" | "java" | "csharp" | "php" | "curl";

export async function sdkSnippet(sb: SB, _userId: string, api_id: string, lang: SdkLang) {
  const { data: api, error } = await sb.from("apigw_api_registry" as never).select("*").eq("id", api_id).single();
  if (error) throw error;
  const { data: routes } = await sb.from("apigw_api_routes" as never).select("method,path,summary").eq("api_id", api_id).eq("active", true).order("path");
  const a = api as { name: string; version: string; base_path: string };
  const first = ((routes ?? [])[0] ?? { method: "GET", path: "/health" }) as { method: string; path: string };
  const url = `${a.base_path}${first.path}`;
  const snippets: Record<SdkLang, string> = {
    curl: `curl -H "Authorization: Bearer $HAPPY_TOKEN" -H "x-api-key: $HAPPY_KEY" -X ${first.method} "${url}"`,
    typescript: `// ${a.name} ${a.version}\nconst res = await fetch("${url}", {\n  method: "${first.method}",\n  headers: { Authorization: \`Bearer \${process.env.HAPPY_TOKEN}\`, "x-api-key": process.env.HAPPY_KEY! },\n});\nconst data = await res.json();`,
    javascript: `const res = await fetch("${url}", { method: "${first.method}", headers: { Authorization: "Bearer " + process.env.HAPPY_TOKEN, "x-api-key": process.env.HAPPY_KEY } });\nconst data = await res.json();`,
    python: `import os, requests\nr = requests.${first.method.toLowerCase()}("${url}", headers={"Authorization": f"Bearer {os.environ['HAPPY_TOKEN']}", "x-api-key": os.environ["HAPPY_KEY"]})\nprint(r.json())`,
    go: `req, _ := http.NewRequest("${first.method}", "${url}", nil)\nreq.Header.Set("Authorization", "Bearer "+os.Getenv("HAPPY_TOKEN"))\nreq.Header.Set("x-api-key", os.Getenv("HAPPY_KEY"))\nres, _ := http.DefaultClient.Do(req)`,
    java: `HttpRequest req = HttpRequest.newBuilder(URI.create("${url}"))\n  .header("Authorization","Bearer "+System.getenv("HAPPY_TOKEN"))\n  .header("x-api-key",System.getenv("HAPPY_KEY"))\n  .method("${first.method}", HttpRequest.BodyPublishers.noBody()).build();`,
    csharp: `var req = new HttpRequestMessage(HttpMethod.${first.method[0]}${first.method.slice(1).toLowerCase()}, "${url}");\nreq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Environment.GetEnvironmentVariable("HAPPY_TOKEN"));\nreq.Headers.Add("x-api-key", Environment.GetEnvironmentVariable("HAPPY_KEY"));`,
    php: `$ch = curl_init("${url}");\ncurl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST=>"${first.method}", CURLOPT_HTTPHEADER=>["Authorization: Bearer ".getenv('HAPPY_TOKEN'), "x-api-key: ".getenv('HAPPY_KEY')], CURLOPT_RETURNTRANSFER=>true]);\n$response = curl_exec($ch);`,
  };
  return { language: lang, url, snippet: snippets[lang] };
}

// =====================================================================
// HEALTH / MONITORING (Founder dashboard)
// =====================================================================
export async function gatewayHealth(sb: SB, _userId: string, opts: { company_id: string }) {
  const [usage, wh, wd, conns] = await Promise.all([
    usageStats(sb, _userId, { company_id: opts.company_id, window_min: 60 }),
    sb.from("apigw_webhook_endpoints" as never).select("id,active,failure_streak,last_success_at,last_failure_at").eq("company_id", opts.company_id),
    sb.from("apigw_webhook_deliveries" as never).select("status").eq("company_id", opts.company_id).gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString()),
    sb.from("apigw_connections" as never).select("status").eq("company_id", opts.company_id),
  ]);
  const eps = (wh.data ?? []) as Array<{ active: boolean; failure_streak: number }>;
  const deliveries = (wd.data ?? []) as Array<{ status: string }>;
  const cs = (conns.data ?? []) as Array<{ status: string }>;
  const bucket = (arr: Array<{ status: string }>) => arr.reduce<Record<string, number>>((m, r) => { m[r.status] = (m[r.status] ?? 0) + 1; return m; }, {});
  return {
    facts: {
      window_min: 60,
      requests_total: usage.total,
      errors: usage.errors,
      error_rate: usage.error_rate,
      latency_p50_ms: usage.latency_p50,
      latency_p95_ms: usage.latency_p95,
      top_apis: usage.top_apis,
      top_consumers: usage.top_consumers,
      webhook_endpoints_total: eps.length,
      webhook_endpoints_failing: eps.filter((e) => e.failure_streak > 0).length,
      webhook_deliveries_24h: bucket(deliveries),
      connectors: bucket(cs),
    },
    ai_recommendations: buildRecommendations(usage, eps, bucket(deliveries), bucket(cs)),
  };
}

function buildRecommendations(
  usage: { error_rate: number; latency_p95: number; top_apis: Array<{ id: string; count: number }> },
  eps: Array<{ failure_streak: number; active: boolean }>,
  deliveries: Record<string, number>,
  connectors: Record<string, number>,
) {
  const recs: string[] = [];
  if (usage.error_rate > 0.05) recs.push(`Error rate ${(usage.error_rate * 100).toFixed(1)}% exceeds 5% — investigate top failing routes.`);
  if (usage.latency_p95 > 1500) recs.push(`p95 latency ${usage.latency_p95}ms exceeds 1500ms — add caching or move work off-request.`);
  const failing = eps.filter((e) => e.failure_streak >= 3).length;
  if (failing > 0) recs.push(`${failing} webhook endpoint(s) failing repeatedly — verify subscriber URL and secret.`);
  if ((deliveries.dead_letter ?? 0) > 0) recs.push(`${deliveries.dead_letter} webhook(s) in dead-letter — review and replay after fixing the subscriber.`);
  if ((connectors.error ?? 0) > 0) recs.push(`${connectors.error} connector(s) unhealthy — run health check and re-authenticate.`);
  if (recs.length === 0) recs.push("Gateway healthy. No action recommended.");
  return recs;
}
