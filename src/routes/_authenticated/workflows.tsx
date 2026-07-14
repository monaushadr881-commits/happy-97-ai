/** /workflows — Phase 2.11 Autonomous Workflow Engine layout. */
import { createFileRoute } from "@tanstack/react-router";
import { Workflow, PenTool, History, BarChart3 } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/workflows", label: "Overview", icon: Workflow, exact: true },
  { to: "/workflows/designer", label: "Designer", icon: PenTool },
  { to: "/workflows/history", label: "History", icon: History },
  { to: "/workflows/analytics", label: "Analytics", icon: BarChart3 },
];

export const Route = createFileRoute("/_authenticated/workflows")({
  head: () => ({ meta: [{ title: "Workflows — HAPPY v2.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.0 · Phase 2.11"
      title="Autonomous Workflow Engine"
      description="Goal-driven workflows with dependency graph, execution queue, retry policy, approval gates and scheduler. Reuses existing RBAC and audit."
      icon={Workflow}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Active workflows", value: "0", hint: "Reserved" },
          { label: "Runs today", value: "0", hint: "Queue idle" },
          { label: "Pending approvals", value: "0", hint: "Approval engine ready" },
          { label: "Success rate", value: "—", hint: "Retry policy standby" },
        ],
        note: "Workflow AI decomposes goals into task graphs, schedules execution, retries on failure, and requests approval when policy requires.",
      }}
    />
  ),
});
