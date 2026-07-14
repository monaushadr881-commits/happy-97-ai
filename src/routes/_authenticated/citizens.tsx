/** /citizens — Citizen Platform · v8.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/citizens")({
  head: () => ({ meta: [{ title: "Citizen Platform — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Citizen Platform · v8.0"
      title="Citizen Platform"
      description="Unified citizen dashboard, applications, complaints, approvals, identity, records and service tracking."
      icon={Users}
      features={["Citizen Dashboard","Applications","Complaints","Approvals","Identity","Records","Tracking"]}
    />
  ),
});
