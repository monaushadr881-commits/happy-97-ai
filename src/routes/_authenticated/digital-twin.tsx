/** /digital-twin — v4.0 Digital Twin surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/digital-twin")({
  head: () => ({ meta: [{ title: "Digital Twin — HAPPY v4.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global AI Platform · v4.0"
      title="Digital Twin"
      description="Enterprise, business, factory, school, hospital and city twins with a shared simulation and scenario engine."
      icon={Boxes}
      features={[
        "Enterprise Twin",
        "Business Twin",
        "Factory Twin",
        "School Twin",
        "Hospital Twin",
        "City Twin",
        "Analytics Twin",
        "Simulation Engine",
        "Scenario Engine",
      ]}
    />
  ),
});
