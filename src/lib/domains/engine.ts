/**
 * R15 — Domain & SSL Management Runtime (server-only)
 *
 * Reuses the R14 deployment/domain tables. This engine owns the domain
 * lifecycle state machine (pending → verification_required → verified →
 * active → suspended | expired) and the SSL lifecycle
 * (pending → issued → active → renewing → expired | failed).
 *
 * Verification is real: a DNS TXT lookup via DNS-over-HTTPS (Cloudflare)
 * checks for the expected `_hxp-verify.<host>` token. SSL provisioning
 * against a real ACME provider is honestly PLANNED — until wired, SSL is
 * marked "pending" and never falsely reported as "active".
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

export type DomainState =
  | "pending" | "verification_required" | "verifying" | "verified"
  | "active" | "suspended" | "expired" | "failed" | "removed";

export type SslState =
  | "pending" | "issued" | "active" | "renewing" | "expired" | "failed";

export type DnsStatus = "unknown" | "ok" | "missing" | "mismatch" | "error";

const HOST_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const PLATFORM_TARGET = "hosted.happy-platform.app";

/* ------------------------------ audit + events ---------------------- */

async function writeAudit(sb: SB, action: string, domainId: string, meta: Record<string, unknown>) {
  try {
    await sb.rpc("write_audit", {
      _category: "domain",
      _action: action,
      _entity_type: "project_domains",
      _entity_id: domainId,
      _metadata: meta as never,
    });
  } catch { /* best effort */ }
}

async function notify(sb: SB, userId: string, event: string, payload: Record<string, unknown>) {
  try {
    await sb.from("notifications").insert({
      user_id: userId,
      kind: `domain.${event}`,
      title: `Domain: ${event.replace(/_/g, " ")}`,
      body: JSON.stringify(payload),
      channel: "in_app",
      metadata: payload as never,
    } as never);
  } catch { /* best effort */ }
}

async function logEvent(
  sb: SB, domainId: string, eventType: string, message: string,
  level: "info" | "warn" | "error" = "info", metadata: Record<string, unknown> = {},
) {
  try {
    await sb.from("project_domain_events").insert({
      domain_id: domainId, event_type: eventType, level, message,
      metadata: metadata as never,
    } as never);
  } catch { /* best effort */ }
}

/* ------------------------------ helpers ----------------------------- */

function buildDnsRecords(hostname: string, token: string) {
  return [
    { type: "TXT", name: `_hxp-verify.${hostname}`, value: token,
      purpose: "ownership_verification" },
    { type: "CNAME", name: hostname, value: PLATFORM_TARGET,
      purpose: "traffic_routing" },
  ];
}

async function loadDomain(sb: SB, id: string) {
  const { data, error } = await sb.from("project_domains")
    .select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("domain_not_found");
  return data as Record<string, unknown>;
}

/* ------------------------------ operations -------------------------- */

export async function addDomain(
  sb: SB,
  args: { projectId: string; userId: string; hostname: string; isPrimary?: boolean },
) {
  const hostname = args.hostname.trim().toLowerCase();
  if (!HOST_RE.test(hostname)) throw new Error("invalid_hostname");
  const token = `hxp-verify-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const dnsRecords = buildDnsRecords(hostname, token);

  const { data, error } = await sb.from("project_domains").insert({
    project_id: args.projectId,
    user_id: args.userId,
    hostname,
    is_primary: Boolean(args.isPrimary),
    status: "pending",
    dns_status: "unknown",
    ssl_state: "pending",
    verification_token: token,
    dns_records: dnsRecords as never,
  } as never).select("*").single();
  if (error) throw error;

  const row = data as { id: string };
  if (args.isPrimary) {
    await sb.from("project_domains").update({ is_primary: false } as never)
      .eq("project_id", args.projectId).neq("id", row.id);
  }
  await logEvent(sb, row.id, "domain.added", `Domain ${hostname} added`, "info",
    { hostname, expectedRecords: dnsRecords });
  await writeAudit(sb, "domain.added", row.id, { hostname });
  await notify(sb, args.userId, "added", { domainId: row.id, hostname });
  return data;
}

export async function listDomains(sb: SB, projectId: string) {
  const { data, error } = await sb.from("project_domains")
    .select("*").eq("project_id", projectId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDomain(sb: SB, id: string) {
  return loadDomain(sb, id);
}

export async function removeDomain(sb: SB, id: string, actorId: string) {
  const d = await loadDomain(sb, id);
  await logEvent(sb, id, "domain.removed", `Domain removed`, "info", {
    hostname: d.hostname, previousStatus: d.status,
  });
  await writeAudit(sb, "domain.removed", id, { hostname: d.hostname });
  const { error } = await sb.from("project_domains").delete().eq("id", id);
  if (error) throw error;
  await notify(sb, actorId, "removed", { domainId: id, hostname: d.hostname });
  return true;
}

export async function setPrimaryDomain(sb: SB, id: string, actorId: string) {
  const d = await loadDomain(sb, id);
  if (d.status !== "active" && d.status !== "verified") {
    throw new Error("primary_requires_verified_domain");
  }
  await sb.from("project_domains").update({ is_primary: false } as never)
    .eq("project_id", d.project_id as string);
  const { data, error } = await sb.from("project_domains")
    .update({ is_primary: true } as never).eq("id", id).select("*").single();
  if (error) throw error;
  await logEvent(sb, id, "domain.primary_set", `Set as primary`, "info", { hostname: d.hostname });
  await writeAudit(sb, "domain.primary_set", id, { hostname: d.hostname });
  await notify(sb, actorId, "primary_set", { domainId: id, hostname: d.hostname });
  return data;
}

export async function updateRedirectRules(
  sb: SB, id: string, rules: Array<{ from: string; to: string; code: 301 | 302 }>,
) {
  for (const r of rules) {
    if (!r?.from || !r?.to || (r.code !== 301 && r.code !== 302)) {
      throw new Error("invalid_redirect_rule");
    }
  }
  const { data, error } = await sb.from("project_domains")
    .update({ redirect_rules: rules as never } as never)
    .eq("id", id).select("*").single();
  if (error) throw error;
  await logEvent(sb, id, "domain.redirect_updated",
    `Redirect rules updated (${rules.length})`, "info", { rules });
  return data;
}

export async function suspendDomain(sb: SB, id: string, reason: string, actorId: string) {
  const { data, error } = await sb.from("project_domains")
    .update({ status: "suspended" as never } as never)
    .eq("id", id).select("*").single();
  if (error) throw error;
  await logEvent(sb, id, "domain.suspended", reason, "warn");
  await writeAudit(sb, "domain.suspended", id, { reason });
  await notify(sb, actorId, "suspended", { domainId: id, reason });
  return data;
}

/* ------------------------------ verification ------------------------ */

async function dnsTxtLookup(name: string): Promise<string[]> {
  // DNS-over-HTTPS (Cloudflare) — Worker-compatible, no Node dns module needed.
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`dns_lookup_failed_${res.status}`);
  const body = await res.json() as { Answer?: Array<{ data: string }> };
  return (body.Answer ?? []).map((a) => a.data.replace(/^"|"$/g, ""));
}

async function dnsCnameLookup(name: string): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=CNAME`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`dns_lookup_failed_${res.status}`);
  const body = await res.json() as { Answer?: Array<{ data: string }> };
  return (body.Answer ?? []).map((a) => a.data.replace(/\.$/, "").toLowerCase());
}

export async function verifyDomain(sb: SB, id: string, actorId: string) {
  const d = await loadDomain(sb, id);
  const hostname = d.hostname as string;
  const token = d.verification_token as string | null;
  if (!token) throw new Error("verification_token_missing");

  const now = new Date().toISOString();
  await sb.from("project_domains").update({
    status: "verifying" as never,
    last_checked_at: now,
  } as never).eq("id", id);
  await logEvent(sb, id, "domain.verify_started", `Verifying ${hostname}`, "info");

  let txtOk = false; let cnameOk = false;
  let dnsStatus: DnsStatus = "unknown"; let errorMessage: string | null = null;

  try {
    const txts = await dnsTxtLookup(`_hxp-verify.${hostname}`);
    txtOk = txts.includes(token);
    const cnames = await dnsCnameLookup(hostname);
    cnameOk = cnames.some((c) => c === PLATFORM_TARGET);
    dnsStatus = txtOk && cnameOk ? "ok" : (!txts.length && !cnames.length ? "missing" : "mismatch");
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    dnsStatus = "error";
  }

  const finishedAt = new Date().toISOString();
  if (txtOk && cnameOk) {
    await sb.from("project_domains").update({
      status: "verified" as never,
      dns_status: dnsStatus,
      verified_at: finishedAt,
      last_checked_at: finishedAt,
      ssl_state: "pending",
      ssl_last_error: null,
    } as never).eq("id", id);
    await logEvent(sb, id, "domain.verified", `Ownership verified for ${hostname}`, "info");
    await writeAudit(sb, "domain.verified", id, { hostname });
    await notify(sb, actorId, "verified", { domainId: id, hostname });
    return { verified: true, dnsStatus, txtOk, cnameOk };
  }

  await sb.from("project_domains").update({
    status: "verification_required" as never,
    dns_status: dnsStatus,
    last_checked_at: finishedAt,
  } as never).eq("id", id);
  await logEvent(sb, id, "domain.verification_failed",
    errorMessage ?? "Required DNS records not found", "warn",
    { txtOk, cnameOk, dnsStatus });
  await writeAudit(sb, "domain.verification_failed", id,
    { hostname, txtOk, cnameOk, dnsStatus });
  await notify(sb, actorId, "verification_failed",
    { domainId: id, hostname, dnsStatus, message: errorMessage });
  return { verified: false, dnsStatus, txtOk, cnameOk, error: errorMessage };
}

export async function checkDns(sb: SB, id: string) {
  const d = await loadDomain(sb, id);
  const hostname = d.hostname as string;
  const token = d.verification_token as string | null;
  const out: {
    hostname: string; txt: string[]; cname: string[];
    txtOk: boolean; cnameOk: boolean; checkedAt: string; error?: string;
  } = { hostname, txt: [], cname: [], txtOk: false, cnameOk: false,
        checkedAt: new Date().toISOString() };
  try {
    out.txt = await dnsTxtLookup(`_hxp-verify.${hostname}`);
    out.cname = await dnsCnameLookup(hostname);
    out.txtOk = Boolean(token) && out.txt.includes(token as string);
    out.cnameOk = out.cname.some((c) => c === PLATFORM_TARGET);
  } catch (err) {
    out.error = err instanceof Error ? err.message : String(err);
  }
  await sb.from("project_domains").update({
    last_checked_at: out.checkedAt,
    dns_status: (out.txtOk && out.cnameOk) ? "ok" :
                (out.error ? "error" : (!out.txt.length && !out.cname.length ? "missing" : "mismatch")),
  } as never).eq("id", id);
  return out;
}

/* ------------------------------ SSL --------------------------------- */

/**
 * SSL provisioning against a real ACME provider (Let's Encrypt, ZeroSSL,
 * Cloudflare) requires provider credentials that are not yet wired. This
 * function honestly records the request and never marks SSL "active"
 * without a real certificate. When a provider is wired, this is the
 * single call site that flips to real issuance.
 */
export async function requestSsl(sb: SB, id: string, actorId: string) {
  const d = await loadDomain(sb, id);
  if (d.status !== "verified" && d.status !== "active") {
    throw new Error("ssl_requires_verified_domain");
  }
  const now = new Date().toISOString();
  await sb.from("project_domains").update({
    ssl_state: "pending" as never,
    ssl_last_error: null,
  } as never).eq("id", id);
  const { error } = await sb.from("project_domain_certificates").insert({
    domain_id: id, state: "pending",
    metadata: { requestedAt: now, provider: "planned" } as never,
  } as never);
  if (error) throw error;
  await logEvent(sb, id, "ssl.requested",
    `SSL requested — provider integration PLANNED`, "info");
  await writeAudit(sb, "ssl.requested", id, { hostname: d.hostname });
  await notify(sb, actorId, "ssl_requested",
    { domainId: id, hostname: d.hostname, note: "Provider integration planned" });
  return { requested: true, state: "pending", note: "Provider integration planned" };
}

/**
 * Renewal is only meaningful after issuance. Until issuance is real, this
 * records the renewal intent — the same honesty rule as requestSsl.
 */
export async function renewSsl(sb: SB, id: string, actorId: string) {
  const d = await loadDomain(sb, id);
  const now = new Date().toISOString();
  await sb.from("project_domains").update({
    ssl_state: "renewing" as never,
  } as never).eq("id", id);
  await logEvent(sb, id, "ssl.renewal_started",
    `Renewal requested — provider integration PLANNED`, "info");
  await writeAudit(sb, "ssl.renewal_started", id, { hostname: d.hostname, at: now });
  await notify(sb, actorId, "ssl_renewal_started",
    { domainId: id, hostname: d.hostname });
  return { renewing: true, at: now };
}

export async function listCertificates(sb: SB, domainId: string) {
  const { data, error } = await sb.from("project_domain_certificates")
    .select("*").eq("domain_id", domainId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listEvents(sb: SB, domainId: string, limit = 50) {
  const { data, error } = await sb.from("project_domain_events")
    .select("*").eq("domain_id", domainId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(200, limit)));
  if (error) throw error;
  return data ?? [];
}

/* ------------------------------ overview ---------------------------- */

export async function domainOverview(sb: SB) {
  const { data, error } = await sb.from("project_domains")
    .select("id, hostname, status, dns_status, ssl_state, ssl_expires_at, is_primary, last_checked_at, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    status: DomainState; ssl_state: SslState; ssl_expires_at: string | null;
    dns_status: DnsStatus;
  }>;
  const soon = Date.now() + 30 * 24 * 3600 * 1000;
  const counts = {
    total: rows.length,
    pending: 0, verifying: 0, verified: 0, active: 0,
    suspended: 0, expired: 0, failed: 0, verification_required: 0,
  };
  const ssl = { pending: 0, issued: 0, active: 0, renewing: 0, expired: 0, failed: 0, expiringSoon: 0 };
  for (const r of rows) {
    if (r.status in counts) (counts as Record<string, number>)[r.status]++;
    if (r.ssl_state in ssl) (ssl as Record<string, number>)[r.ssl_state]++;
    if (r.ssl_expires_at && Date.parse(r.ssl_expires_at) < soon) ssl.expiringSoon++;
  }
  return { counts, ssl, latest: rows.slice(0, 25) };
}
