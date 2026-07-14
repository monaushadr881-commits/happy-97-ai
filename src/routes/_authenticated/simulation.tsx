/** /simulation — v6.0 Enterprise Simulation surface. */
import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/simulation")({
  head: () => ({ meta: [{ title: "Enterprise Simulation — HAPPY v6.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Autonomous Enterprise · v6.0"
      title="Enterprise Simulation"
      description="Business, factory, market, risk, revenue, growth and digital-twin simulators with a full scenario engine — model any what-if before committing capital."
      icon={FlaskConical}
      features={[
        "Business Simulator",
        "Factory Simulator",
        "Market Simulator",
        "Risk Simulator",
        "Revenue Simulator",
        "Growth Simulator",
        "Digital Twin Simulator",
        "Scenario Engine",
      ]}
    />
  ),
});
