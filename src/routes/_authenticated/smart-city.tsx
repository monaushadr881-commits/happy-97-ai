/** /smart-city — Smart City OS · v8.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/smart-city")({
  head: () => ({ meta: [{ title: "Smart City OS — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Smart City OS · v8.0"
      title="Smart City OS"
      description="City, ward, district, state and country dashboards with traffic, water, electricity, sanitation, emergency, environment, pollution and weather intelligence."
      icon={Building2}
      features={["City Dashboard","Ward Dashboard","District Dashboard","State Dashboard","Country Dashboard","Traffic","Water","Electricity","Sanitation","Emergency","Environment","Pollution","Weather"]}
    />
  ),
});
