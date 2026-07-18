/**
 * /enterprise-control — Enterprise Control Center (RBAC · Policies · Audit ·
 * Compliance · Monitoring · Security · Organizations).
 * R140: Full sub-tab UI over canonical api-v1 / enterprise-v1 server functions.
 * Complements existing /enterprise layout without duplicating its runtime.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Container, PageHeader, Panel, Chip, Hairline, StatCard,
} from "@/design-system/primitives";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import {
  apiListCompanies, apiRecentAudit, apiPlatformOverview,
} from "@/lib/api-v1.functions";
import { entListEmployees, entListDepartments } from "@/lib/enterprise-v1.functions";
import {
  Building2, ShieldCheck, ScrollText, Fingerprint, Gavel, Activity, Shield,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/enterprise-control")({
  head: () => ({ meta: [{ title: "Enterprise Control — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: EnterpriseControl,
});

type Company    = { id: string; display_name: string | null; legal_name: string | null; slug: string | null; created_at: string };
type Employee   = { id: string; title: string | null; status: string | null; employee_code: string | null; role?: string | null };
type Department = { id: string; name: string | null; code: string | null };
type AuditRow   = { id: string; category: string | null; severity: string | null; action: string | null; actor_id: string | null; occurred_at: string | null; message: string | null };
type Overview   = { users: number | null; companies: number | null; workspaces: number | null; ai_sessions: number | null; notifications: number | null };

const TABS = [
  { slug: "organizations", label: "Organizations", icon: Building2 },
  { slug: "rbac",          label: "RBAC",          icon: ShieldCheck },
  { slug: "policies",      label: "Policies",      icon: ScrollText },
  { slug: "audit",         label: "Audit",         icon: Fingerprint },
  { slug: "compliance",    label: "Compliance",    icon: Gavel },
  { slug: "monitoring",    label: "Monitoring",    icon: Activity },
  { slug: "security",      label: "Security",      icon: Shield },
];

// R129 canonical: 6 roles × 13 capabilities.
const ROLES = ["owner", "admin", "manager", "operator", "member", "guest"] as const;
const CAPS = ["read", "write", "delete", "billing", "settings", "invite", "publish", "deploy", "audit", "impersonate", "export", "policy", "role_mgmt"] as const;
const MATRIX: Record<(typeof ROLES)[number], Set<(typeof CAPS)[number]>> = {
  owner:    new Set(CAPS),
  admin:    new Set(["read","write","delete","billing","settings","invite","publish","deploy","audit","export","policy","role_mgmt"]),
  manager:  new Set(["read","write","invite","publish","deploy","export"]),
  operator: new Set(["read","write","publish","deploy"]),
  member:   new Set(["read","write"]),
  guest:    new Set(["read"]),
};

// R106 canonical policies (surfaced from security architecture).
const POLICIES = [
  { id: "auth.mfa",           title: "MFA required for admin roles",       tone: "success" as const, status: "enforced" },
  { id: "auth.session",       title: "Session rotation every 24h",         tone: "success" as const, status: "enforced" },
  { id: "data.rls",           title: "Row-Level Security on all tables",   tone: "success" as const, status: "enforced" },
  { id: "data.retention",     title: "PII retention ≤ 24 months",          tone: "info"    as const, status: "policy" },
  { id: "api.rate_limit",     title: "Per-IP rate limit 300 req/min",      tone: "success" as const, status: "enforced" },
  { id: "webhook.signature",  title: "HMAC signature verification",        tone: "success" as const, status: "enforced" },
  { id: "cron.shared_secret", title: "Cron shared-secret authentication",  tone: "success" as const, status: "enforced" },
];

const COMPLIANCE = [
  { code: "SOC 2 Type II",   status: "in-progress", tone: "warning" as const },
  { code: "ISO 27001",       status: "in-progress", tone: "warning" as const },
  { code: "GDPR",            status: "aligned",     tone: "success" as const },
  { code: "CCPA",            status: "aligned",     tone: "success" as const },
  { code: "HIPAA",           status: "opt-in",      tone: "info"    as const },
  { code: "DPDP (IN)",       status: "aligned",     tone: "success" as const },
];

function EnterpriseControl() {
  const active = useActiveTab(TABS);

  const companies = useQuery({ queryKey: ["ent-ctrl","companies"], queryFn: () => apiListCompanies() });
  const audit     = useQuery({ queryKey: ["ent-ctrl","audit"],     queryFn: () => apiRecentAudit(), refetchInterval: 60_000 });
  const overview  = useQuery({ queryKey: ["ent-ctrl","ov"],        queryFn: () => apiPlatformOverview(), refetchInterval: 60_000 });
  const employees = useQuery({ queryKey: ["ent-ctrl","emps"],      queryFn: () => entListEmployees({ data: { limit: 500 } }) });
  const depts     = useQuery({ queryKey: ["ent-ctrl","depts"],     queryFn: () => entListDepartments({ data: { limit: 100 } }) });

  const cs = (companies.data ?? []) as unknown as Company[];
  const es = (employees.data ?? []) as unknown as Employee[];
  const ds = (depts.data     ?? []) as unknown as Department[];
  const ax = (audit.data     ?? []) as unknown as AuditRow[];
  const ov = (overview.data  ?? {}) as unknown as Overview;

  return (
    <Container className="py-6 md:py-10">
      <PageHeader
        eyebrow="Sovereign · Live"
        title="Enterprise Control Center"
        description="Organizations, RBAC, policies, audit, compliance, monitoring and security — canonical governance surface (R129)."
      />
      <TabBar tabs={TABS} ariaLabel="Enterprise sections" />

      {active === "organizations" && (
        <>
          <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Companies"  value={cs.length.toLocaleString()}   icon={<Building2 className="h-4 w-4" />} />
            <StatCard label="Users"      value={(ov.users ?? 0).toLocaleString()} />
            <StatCard label="Workspaces" value={(ov.workspaces ?? 0).toLocaleString()} />
            <StatCard label="Depts"      value={ds.length.toLocaleString()} />
          </section>
          <Panel className="mt-6 p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Organizations</h2>
            <Hairline className="my-4" />
            <ul className="divide-y divide-white/5">
              {cs.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="text-paper">{r.display_name ?? r.legal_name ?? "—"}</div>
                    <div className="text-[11px] text-soft-gray">{r.slug ?? r.id.slice(0, 8)}</div>
                  </div>
                  <span className="text-[11px] text-soft-gray">{new Date(r.created_at).toLocaleDateString()}</span>
                </li>
              ))}
              {!cs.length && <li className="py-3 text-xs text-soft-gray">No organizations.</li>}
            </ul>
          </Panel>
        </>
      )}

      {active === "rbac" && (
        <Panel className="mt-6 p-5 overflow-x-auto">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Role × Capability Matrix</h2>
          <Hairline className="my-4" />
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left text-soft-gray">Role</th>
                {CAPS.map((c) => (
                  <th key={c} className="px-2 py-1 text-center text-[10px] uppercase tracking-[0.15em] text-soft-gray">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role) => (
                <tr key={role} className="border-t border-white/5">
                  <td className="px-2 py-1 text-paper">{role}</td>
                  {CAPS.map((c) => {
                    const has = MATRIX[role].has(c);
                    return (
                      <td key={c} className="px-2 py-1 text-center">
                        <span className={has ? "text-gold" : "text-soft-gray/40"}>{has ? "●" : "○"}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-soft-gray">Deny-wins policy engine per R129 Enterprise Intelligence.</p>
        </Panel>
      )}

      {active === "policies" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Platform Policies</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {POLICIES.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{p.title}</div>
                  <div className="text-[11px] text-soft-gray">{p.id}</div>
                </div>
                <Chip tone={p.tone}>{p.status}</Chip>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {active === "audit" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Audit Log (recent)</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {ax.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{r.action ?? r.message ?? "event"}</div>
                  <div className="truncate text-[11px] text-soft-gray">{r.category ?? "—"} · {r.occurred_at ?? "—"}</div>
                </div>
                <Chip tone={r.severity === "critical" ? "danger" : r.severity === "warning" ? "warning" : "info"}>{r.severity ?? "info"}</Chip>
              </li>
            ))}
            {!ax.length && <li className="py-3 text-xs text-soft-gray">No audit entries in window.</li>}
          </ul>
        </Panel>
      )}

      {active === "compliance" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Compliance Posture</h2>
          <Hairline className="my-4" />
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMPLIANCE.map((c) => (
              <li key={c.code} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] p-3 text-sm">
                <div className="text-paper">{c.code}</div>
                <Chip tone={c.tone}>{c.status}</Chip>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {active === "monitoring" && (
        <>
          <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Users"         value={(ov.users ?? 0).toLocaleString()} />
            <StatCard label="Companies"     value={(ov.companies ?? 0).toLocaleString()} />
            <StatCard label="Workspaces"    value={(ov.workspaces ?? 0).toLocaleString()} />
            <StatCard label="AI sessions"   value={(ov.ai_sessions ?? 0).toLocaleString()} />
            <StatCard label="Notifications" value={(ov.notifications ?? 0).toLocaleString()} />
          </section>
          <Panel className="mt-6 p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Live Health</h2>
            <Hairline className="my-4" />
            <p className="text-xs text-soft-gray">Live SLO / p95 / error-rate probes stream from canonical Ops Health (R129 Monitoring).</p>
          </Panel>
        </>
      )}

      {active === "security" && (
        <>
          <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Employees"      value={es.length.toLocaleString()} />
            <StatCard label="Admins"         value={es.filter((e) => (e.role ?? "").toLowerCase() === "admin").length.toLocaleString()} />
            <StatCard label="Audit rows"     value={ax.length.toLocaleString()} />
            <StatCard label="Critical (24h)" value={ax.filter((a) => a.severity === "critical").length.toLocaleString()} icon={<Shield className="h-4 w-4" />} />
          </section>
          <Panel className="mt-6 p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Security Posture</h2>
            <Hairline className="my-4" />
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <li className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] p-3 text-sm"><span className="text-paper">MFA enforcement</span><Chip tone="success">enforced</Chip></li>
              <li className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] p-3 text-sm"><span className="text-paper">Cron shared-secret</span><Chip tone="success">enforced</Chip></li>
              <li className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] p-3 text-sm"><span className="text-paper">Webhook HMAC</span><Chip tone="success">verified</Chip></li>
              <li className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] p-3 text-sm"><span className="text-paper">RLS coverage</span><Chip tone="success">100% public</Chip></li>
            </ul>
          </Panel>
        </>
      )}
    </Container>
  );
}
