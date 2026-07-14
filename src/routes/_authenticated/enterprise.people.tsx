/** /enterprise/people — Employee directory (RLS-scoped to company). */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import { entListEmployees } from "@/lib/enterprise-v1.functions";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/enterprise/people")({
  head: () => ({ meta: [{ title: "People — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: People,
});

type Employee = { id: string; user_id?: string | null; job_title?: string | null; employment_type?: string | null; status?: string | null; hired_at?: string | null };

function People() {
  const { companyId, companies } = useEnterprise();
  const [q, setQ] = useState("");
  const list = useQuery({
    queryKey: ["ent", "employees", companyId],
    enabled: !!companyId,
    queryFn: () => entListEmployees({ data: { company_id: companyId!, limit: 200 } }),
  });

  if (!companyId) return (<><PageHeader eyebrow="People" title="Employees" /><NoCompanySelected hasAny={companies.length > 0} /></>);

  const rows = ((list.data ?? []) as Employee[]).filter((r) =>
    !q ? true : (r.job_title ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader eyebrow="People" title="Employee Directory" description="Every employee in the company. Departments, roles, employment type, hire date." />

      <div className="mb-4 flex items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by job title…" className="max-w-xs bg-white/[0.02] border-white/10" />
        <Chip tone="gold">{rows.length}</Chip>
      </div>

      <Panel className="p-0 overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_1fr_140px_140px_140px] gap-3 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-soft-gray border-b border-white/5">
          <div>Employee</div><div>Role</div><div>Type</div><div>Status</div><div>Hired</div>
        </div>
        <ul className="divide-y divide-white/5">
          {rows.map((e) => (
            <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_1fr_140px_140px_140px] items-center gap-3 px-4 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gold/10 text-gold">
                  <Users className="h-4 w-4" />
                </div>
                <span className="truncate text-paper">{e.user_id?.slice(0, 8) ?? e.id.slice(0, 8)}</span>
              </div>
              <div className="truncate text-paper">{e.job_title ?? "—"}</div>
              <div className="text-soft-gray text-xs">{e.employment_type ?? "—"}</div>
              <div><Chip tone={e.status === "active" ? "success" : "neutral"}>{e.status ?? "—"}</Chip></div>
              <div className="numeric text-[11px] text-soft-gray">{e.hired_at ? new Date(e.hired_at).toLocaleDateString() : "—"}</div>
            </li>
          ))}
          {!rows.length && <li className="py-6 text-center text-xs text-soft-gray">No employees.</li>}
        </ul>
      </Panel>
      <Hairline className="mt-6" />
    </>
  );
}
