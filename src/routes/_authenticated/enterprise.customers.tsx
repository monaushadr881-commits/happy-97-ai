/** /enterprise/customers — Customer directory & lifetime value. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import { entListCustomers } from "@/lib/enterprise-v1.functions";

export const Route = createFileRoute("/_authenticated/enterprise/customers")({
  head: () => ({ meta: [{ title: "Customers — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: Customers,
});

type Customer = { id: string; display_name?: string; email?: string | null; phone?: string | null; status?: string | null; lifetime_value_cents?: number | null; created_at?: string };

function Customers() {
  const { companyId, companies } = useEnterprise();
  const [q, setQ] = useState("");
  const list = useQuery({
    queryKey: ["ent", "customers", companyId],
    enabled: !!companyId,
    queryFn: () => entListCustomers({ data: { company_id: companyId!, limit: 200 } }),
  });
  if (!companyId) return (<><PageHeader eyebrow="CRM" title="Customers" /><NoCompanySelected hasAny={companies.length > 0} /></>);

  const rows = ((list.data ?? []) as Customer[]).filter((c) =>
    !q ? true : (c.display_name ?? "").toLowerCase().includes(q.toLowerCase()) || (c.email ?? "").toLowerCase().includes(q.toLowerCase()),
  );
  const totalLtv = rows.reduce((a, c) => a + (c.lifetime_value_cents ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Customer Directory"
        description="Every customer. Lifetime value, contact and pipeline status."
        actions={<Chip tone="gold">{`LTV $${(totalLtv / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</Chip>}
      />

      <div className="mb-4 flex items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="max-w-xs bg-white/[0.02] border-white/10" />
        <Chip tone="gold">{rows.length}</Chip>
      </div>

      <Panel className="p-0 overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_140px_140px_140px] gap-3 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-soft-gray border-b border-white/5">
          <div>Name</div><div>Email</div><div>Status</div><div>LTV</div><div>Since</div>
        </div>
        <ul className="divide-y divide-white/5">
          {rows.map((c) => (
            <li key={c.id} className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_140px_140px_140px] items-center gap-3 px-4 py-2 text-sm">
              <div className="truncate text-paper">{c.display_name ?? c.id.slice(0, 8)}</div>
              <div className="truncate text-soft-gray text-xs">{c.email ?? "—"}</div>
              <div><Chip tone={c.status === "active" ? "success" : "neutral"}>{c.status ?? "—"}</Chip></div>
              <div className="numeric text-paper">${((c.lifetime_value_cents ?? 0) / 100).toLocaleString()}</div>
              <div className="numeric text-[11px] text-soft-gray">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</div>
            </li>
          ))}
          {!rows.length && <li className="py-6 text-center text-xs text-soft-gray">No customers.</li>}
        </ul>
      </Panel>
    </>
  );
}
