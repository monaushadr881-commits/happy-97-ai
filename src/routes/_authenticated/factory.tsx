/** /factory — Factory Operations · v10.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/factory")({
  head: () => ({ meta: [{ title: "Factory Operations — HAPPY v10.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Factory Operations · v10.0"
      title="Factory Operations"
      description="Real-time factory command center with plant, shift and supervisor operations orchestration."
      icon={Building2}
      features={["Factory Command","Plant Ops","Shift Ops","Supervisor Console","Live KPIs"]}
    />
  ),
});
