/** /monitoring — v4.0 Observability surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring — HAPPY v4.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global AI Platform · v4.0"
      title="Observability"
      description="Logs, tracing, metrics, monitoring, alerting, incidents, deployment, security and performance dashboards."
      icon={Activity}
      features={[
        "Logs",
        "Tracing",
        "Metrics",
        "Monitoring",
        "Alerting",
        "Incidents",
        "Deployment Dashboard",
        "Security Dashboard",
        "Performance Dashboard",
      ]}
    />
  ),
});
