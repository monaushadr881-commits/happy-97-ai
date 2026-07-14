/** /public-health — Public Health · v8.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/public-health")({
  head: () => ({ meta: [{ title: "Public Health — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Public Health · v8.0"
      title="Public Health"
      description="Hospital dashboards, vaccination, medical records, appointments, medicine inventory, emergency response and disease monitoring."
      icon={HeartPulse}
      features={["Hospital Dashboard","Health Analytics","Vaccination","Medical Records","Appointments","Medicine Inventory","Emergency Response","Disease Monitoring"]}
    />
  ),
});
