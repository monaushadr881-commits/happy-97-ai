/** /business/hr — Employees, attendance, leave, performance. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizListEmployees } from "@/lib/business-v1.functions";
import { UserCog } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/hr")({
  head: () => ({ meta: [{ title: "HRMS — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: HR,
});

type Employee = { id: string; employee_code: string | null; title: string | null; status: string | null; hired_on: string | null; department_id: string | null; office_id: string | null };

function HR() {
  const { companyId, companies } = useBusiness();
  const q = useQuery({ queryKey: ["biz", "emps", companyId], enabled: !!companyId, queryFn: () => bizListEmployees({ data: { company_id: companyId!, limit: 200 } }) });
  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="HRMS" /><NoCompany hasAny={companies.length > 0} /></>);
  const e = (q.data ?? []) as Employee[];
  const active = e.filter((x) => x.status === "active").length;

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Human Resource Management" description="Employees, attendance, leave, payroll-ready pipelines, recruitment and performance." />
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Employees" value={e.length.toLocaleString()} icon={<UserCog className="h-4 w-4" />} />
        <StatCard label="Active" value={active.toLocaleString()} icon={<UserCog className="h-4 w-4" />} />
        <StatCard label="Departments (linked)" value={new Set(e.map((x) => x.department_id).filter(Boolean)).size.toLocaleString()} icon={<UserCog className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Employee Directory</h2>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {e.slice(0, 20).map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="text-paper">{r.title ?? "—"}</div>
                <div className="text-[11px] text-soft-gray">{r.employee_code ?? r.id.slice(0, 8)} · hired {r.hired_on ?? "—"}</div>
              </div>
              <Chip tone={r.status === "active" ? "success" : r.status === "terminated" ? "danger" : "info"}>{r.status ?? "—"}</Chip>
            </li>
          ))}
          {!e.length && <li className="py-2 text-xs text-soft-gray">No employees.</li>}
        </ul>
      </Panel>
    </>
  );
}
