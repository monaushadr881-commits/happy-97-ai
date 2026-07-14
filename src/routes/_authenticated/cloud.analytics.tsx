/** /cloud/analytics — v5.0 Enterprise Cloud Analytics. */
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/cloud/analytics")({
  head: () => ({ meta: [{ title: "Cloud Analytics — HAPPY v5.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Cloud Platform · v5.0"
      title="Enterprise Analytics"
      description="Executive, business, AI, developer, usage, cost and forecast analytics rolled into one enterprise dashboard."
      icon={BarChart3}
      features={[
        "Executive Dashboards",
        "Business Analytics",
        "AI Analytics",
        "Developer Analytics",
        "Usage Analytics",
        "Cost Analytics",
        "Forecast Analytics",
      ]}
    />
  ),
});
