/** /maintenance — Maintenance Platform · v10.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance Platform — HAPPY v10.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Maintenance Platform · v10.0"
      title="Maintenance Platform"
      description="Preventive, predictive and breakdown maintenance, work orders, calendar, analytics and equipment history."
      icon={Wrench}
      features={["Preventive","Predictive","Breakdown","Work Orders","Calendar","Analytics","Equipment History"]}
    />
  ),
});
