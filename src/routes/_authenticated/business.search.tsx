/** /business/search — Universal Business Search. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizUniversalSearch } from "@/lib/business-v1.functions";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/search")({
  head: () => ({ meta: [{ title: "Search — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { companyId, companies } = useBusiness();
  const [q, setQ] = useState("");
  const trimmed = q.trim();
  const query = useQuery({
    queryKey: ["biz", "search", companyId, trimmed],
    enabled: !!companyId && trimmed.length >= 2,
    queryFn: () => bizUniversalSearch({ data: { company_id: companyId!, q: trimmed, limit: 8 } }),
  });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Search" /><NoCompany hasAny={companies.length > 0} /></>);
  const r = query.data;

  const section = (title: string, items: Array<Record<string, unknown>>, render: (it: Record<string, unknown>) => string) => (
    <Panel className="p-5">
      <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">{title}</h2>
      <Hairline className="my-4" />
      <ul className="divide-y divide-white/5">
        {items.map((it, i) => (
          <li key={i} className="py-2 text-sm text-paper">{render(it)}</li>
        ))}
        {!items.length && <li className="py-2 text-xs text-soft-gray">No results.</li>}
      </ul>
    </Panel>
  );

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Universal Business Search" description="Search customers, products, invoices, orders, suppliers and employees — scoped to the current company." />

      <Panel className="p-4">
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 text-soft-gray" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search across all business entities…"
            className="bg-transparent border-white/10 text-paper"
          />
        </div>
      </Panel>

      {trimmed.length >= 2 && r && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {section("Customers", r.customers, (it) => `${it.name ?? "—"} · ${it.email ?? it.code ?? ""}`)}
          {section("Products", r.products, (it) => `${it.name ?? "—"} · ${it.sku ?? ""}`)}
          {section("Invoices", r.invoices, (it) => `${it.number ?? "—"} · ${it.status ?? ""}`)}
          {section("Orders", r.orders, (it) => `${it.number ?? "—"} · ${it.status ?? ""}`)}
          {section("Suppliers", r.suppliers, (it) => `${it.name ?? "—"} · ${it.email ?? it.code ?? ""}`)}
          {section("Employees", r.employees, (it) => `${it.employee_code ?? "—"} · ${it.title ?? ""}`)}
        </div>
      )}
    </>
  );
}
