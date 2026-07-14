/** /execution — Phase 2.15 Autonomous Execution Engine. */
import { createFileRoute } from "@tanstack/react-router";
import { Rocket, ListChecks, History, BarChart3 } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/execution", label: "Overview", icon: Rocket, exact: true },
  { to: "/execution/tasks", label: "Tasks", icon: ListChecks },
  { to: "/execution/history", label: "History", icon: History },
  { to: "/execution/analytics", label: "Analytics", icon: BarChart3 },
];

export const Route = createFileRoute("/_authenticated/execution")({
  head: () => ({ meta: [{ title: "Execution Engine — HAPPY v2.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.0 · Phase 2.15"
      title="Autonomous Execution Engine"
      description="Goal engine, execution planner, action queue, dependency resolver, approval workflow, retry, rollback and progress tracker for long-running enterprise work."
      icon={Rocket}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Active goals", value: "0", hint: "Reserved" },
          { label: "Queued tasks", value: "0", hint: "Idle" },
          { label: "Pending approvals", value: "0", hint: "Approval engine ready" },
          { label: "Success rate", value: "—", hint: "Retry policy" },
        ],
        note: "Supports background jobs, scheduled execution, conditional logic, approvals, failure recovery and notifications. All actions reuse the existing RBAC and audit trail.",
      }}
    />
  ),
});
