/** /automation — v6.0 Automation Studio surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/automation")({
  head: () => ({ meta: [{ title: "Automation Studio — HAPPY v6.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Autonomous Enterprise · v6.0"
      title="Automation Studio"
      description="Visual automation builder with event engine, triggers, conditions, actions, scheduling, approval chains, execution history and end-to-end automation analytics."
      icon={Workflow}
      features={[
        "Visual Builder",
        "Event Engine",
        "Triggers",
        "Conditions",
        "Actions",
        "Scheduling",
        "Approval Chains",
        "Execution History",
        "Automation Analytics",
        "Sales · Purchase · Inventory",
        "Finance · Accounting · Payroll",
        "HR · Project · Notifications",
      ]}
    />
  ),
});
