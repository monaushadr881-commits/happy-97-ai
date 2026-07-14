/** /digital-factory — Digital Factory · v10.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Cpu } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/digital-factory")({
  head: () => ({ meta: [{ title: "Digital Factory — HAPPY v10.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Digital Factory · v10.0"
      title="Digital Factory"
      description="Factory twin, production/machine/capacity/maintenance simulation, scenario planning and factory intelligence."
      icon={Cpu}
      features={["Factory Twin","Production Sim","Machine Sim","Capacity Sim","Maintenance Sim","Scenario Planning","Intelligence"]}
    />
  ),
});
