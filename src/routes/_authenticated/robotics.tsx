/** /robotics — Robotics OS · v11.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/robotics")({
  head: () => ({ meta: [{ title: "Robotics OS — HAPPY v11.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Robotics OS · v11.0"
      title="Robotics OS"
      description="Robot dashboard, fleet, registry, health, status, missions, scheduler, analytics and diagnostics."
      icon={Bot}
      features={["Robot Dashboard","Fleet","Registry","Health","Status","Missions","Scheduler","Analytics","Diagnostics"]}
    />
  ),
});
