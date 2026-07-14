/** /business/manufacturing — BOMs, Production Orders, Quality, Machines (registry). */
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { Factory } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/manufacturing")({
  head: () => ({ meta: [{ title: "Manufacturing — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Manufacturing,
});

const MODULES = [
  { name: "Bills of Materials (BOM)", desc: "Structured component graphs with revisions and cost roll-up." },
  { name: "Recipes / Formulations", desc: "Batch and continuous manufacturing recipes with yields." },
  { name: "Production Orders", desc: "Plan-to-produce lifecycle with routing and step tracking." },
  { name: "Work Orders", desc: "Machine and operator assignment with time tracking." },
  { name: "Quality Control", desc: "Inspection plans, non-conformance and corrective actions." },
  { name: "Raw Materials & Finished Goods", desc: "Bidirectional stock ties to inventory positions." },
  { name: "Machine Registry", desc: "Assets, maintenance schedule, downtime and OEE." },
  { name: "Waste Tracking", desc: "Scrap classification and cost attribution." },
];

function Manufacturing() {
  const { companyId, companies } = useBusiness();
  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Manufacturing" /><NoCompany hasAny={companies.length > 0} /></>);
  return (
    <>
      <PageHeader
        eyebrow="Business OS"
        title="Manufacturing Operations"
        description="Bills of materials, production orders, quality control and machine registry — powered by shared inventory positions."
      />
      <Panel className="p-5">
        <div className="flex items-center gap-3">
          <Factory className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Manufacturing Modules</h2>
          <Chip tone="info">Foundation Ready</Chip>
        </div>
        <Hairline className="my-4" />
        <div className="grid gap-3 md:grid-cols-2">
          {MODULES.map((m) => (
            <div key={m.name} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
              <div className="text-sm text-paper">{m.name}</div>
              <div className="text-[11px] text-soft-gray mt-1">{m.desc}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-soft-gray">
          Production tables layer on top of the shared inventory + warehouse services (Phase 4).
          Every future manufacturing screen must consume only the business-v1 API — never the
          database directly.
        </p>
      </Panel>
    </>
  );
}
