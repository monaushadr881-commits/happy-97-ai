/** /intelligence — v3.0 roadmap placeholder (Enterprise Intelligence). */
import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/intelligence")({
  head: () => ({ meta: [{ title: "Intelligence — HAPPY Roadmap v3.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Roadmap · v3.0"
      title="Enterprise Intelligence"
      description="Reserved surface for predictive analytics, executive AI advisory, business forecasting and decision intelligence. The service layer and API contracts are in place — dashboards activate with v3.0."
      icon={BrainCircuit}
      features={[
        "Predictive Analytics",
        "Executive AI Advisor",
        "Business Forecasting",
        "Scenario Planning",
        "AI Reports",
        "AI Insights",
        "Decision Intelligence",
      ]}
    />
  ),
});
