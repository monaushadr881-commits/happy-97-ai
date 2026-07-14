/** /public-safety — Public Safety · v8.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/public-safety")({
  head: () => ({ meta: [{ title: "Public Safety — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Public Safety · v8.0"
      title="Public Safety"
      description="Police, fire and disaster management with emergency alerts, crime analytics, safety monitoring and incident center. (uses public-ai service group)."
      icon={Shield}
      features={["Police Dashboard","Fire Dashboard","Disaster Management","Emergency Alerts","Crime Analytics","Safety Monitoring","Incident Center"]}
    />
  ),
});
