/**
 * /enterprise/structure — Organization hierarchy.
 * Brands · Business Units → Departments · Offices · Workspaces.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import { apiListBrands } from "@/lib/api-v1.functions";
import { entListDepartments, entListOffices } from "@/lib/enterprise-v1.functions";
import { Layers, Boxes, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/enterprise/structure")({
  head: () => ({ meta: [{ title: "Structure — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: EnterpriseStructure,
});

function EnterpriseStructure() {
  const { companyId, companies } = useEnterprise();
  const brands = useQuery({ queryKey: ["ent", "brands", companyId], enabled: !!companyId, queryFn: () => apiListBrands({ data: { company_id: companyId! } }) });
  const departments = useQuery({ queryKey: ["ent", "departments", companyId], enabled: !!companyId, queryFn: () => entListDepartments({ data: { company_id: companyId! } }) });
  const offices = useQuery({ queryKey: ["ent", "offices", companyId], enabled: !!companyId, queryFn: () => entListOffices({ data: { company_id: companyId! } }) });

  if (!companyId) {
    return (<><PageHeader eyebrow="Governance" title="Structure" /><NoCompanySelected hasAny={companies.length > 0} /></>);
  }

  return (
    <>
      <PageHeader eyebrow="Governance" title="Organization Structure" description="Brands, business units, departments, offices and workspaces — the shape of the company." />

      <div className="grid gap-4 lg:grid-cols-3">
        <PanelList
          icon={<Layers className="h-4 w-4 text-gold" />}
          title="Brands"
          rows={(brands.data ?? []) as Array<{ id: string; name: string; slug?: string | null; status?: string | null }>}
          render={(b) => ({ title: b.name, subtitle: b.slug ?? "", status: b.status })}
        />
        <PanelList
          icon={<Boxes className="h-4 w-4 text-gold" />}
          title="Departments"
          rows={(departments.data ?? []) as Array<{ id: string; name: string; code?: string | null; status?: string | null }>}
          render={(d) => ({ title: d.name, subtitle: d.code ?? "", status: d.status })}
        />
        <PanelList
          icon={<Building2 className="h-4 w-4 text-gold" />}
          title="Offices"
          rows={(offices.data ?? []) as Array<{ id: string; name: string; city?: string | null; country?: string | null; status?: string | null }>}
          render={(o) => ({ title: o.name, subtitle: [o.city, o.country].filter(Boolean).join(" · "), status: o.status })}
        />
      </div>
    </>
  );
}

function PanelList<T extends { id: string }>({
  icon, title, rows, render,
}: {
  icon: React.ReactNode;
  title: string;
  rows: T[];
  render: (row: T) => { title: string; subtitle?: string | null; status?: string | null };
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">{icon}<h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">{title}</h2></div>
        <Chip tone="gold">{rows.length}</Chip>
      </div>
      <Hairline className="my-4" />
      <ul className="divide-y divide-white/5">
        {rows.map((r) => {
          const v = render(r);
          return (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate text-paper">{v.title}</div>
                {v.subtitle && <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">{v.subtitle}</div>}
              </div>
              {v.status && <Chip tone={v.status === "active" ? "success" : "neutral"}>{v.status}</Chip>}
            </li>
          );
        })}
        {!rows.length && <li className="py-2 text-xs text-soft-gray">Nothing yet.</li>}
      </ul>
    </Panel>
  );
}
