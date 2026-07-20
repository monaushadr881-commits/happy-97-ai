/** /enterprise/customers — Customer directory & lifetime value. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import { entListCustomers } from "@/lib/enterprise-v1.functions";
import { VirtualTable, type VirtualTableColumn } from "@/components/ui/virtual-table";

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

  const columns: VirtualTableColumn<Customer>[] = [
    { key: "name", header: "Name", width: "minmax(0,1.5fr)", cell: (c) => <span className="truncate text-paper">{c.display_name ?? c.id.slice(0, 8)}</span> },
    { key: "email", header: "Email", width: "minmax(0,1.5fr)", cell: (c) => <span className="truncate text-soft-gray text-xs">{c.email ?? "—"}</span> },
    { key: "status", header: "Status", width: 140, cell: (c) => <Chip tone={c.status === "active" ? "success" : "neutral"}>{c.status ?? "—"}</Chip> },
    { key: "ltv", header: "LTV", width: 140, cell: (c) => <span className="numeric text-paper">${((c.lifetime_value_cents ?? 0) / 100).toLocaleString()}</span> },
    { key: "since", header: "Since", width: 140, cell: (c) => <span className="numeric text-[11px] text-soft-gray">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</span> },
  ];

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
        <VirtualTable
          rows={rows}
          columns={columns}
          getRowKey={(c) => c.id}
          rowHeight={40}
          height={560}
          ariaLabel="Customers"
          empty="No customers."
          className="border-0 bg-transparent"
        />
      </Panel>
    </>
  );
}
