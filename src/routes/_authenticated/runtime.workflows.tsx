/** /runtime/workflows — Phase 3.3 Autonomous Workflow Runtime layout. */
import { createFileRoute } from "@tanstack/react-router";
import { Workflow, Radio, History } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/runtime/workflows", label: "Overview", icon: Workflow, exact: true },
  { to: "/runtime/workflows/live", label: "Live", icon: Radio },
  { to: "/runtime/workflows/history", label: "History", icon: History },
];

export const Route = createFileRoute("/_authenticated/runtime/workflows")({
  head: () => ({ meta: [{ title: "Runtime Workflows — HAPPY v2.1" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.1 · Phase 3.3"
      title="Autonomous Workflow Runtime"
      description="Approval, retry, rollback, monitoring, timeline and analytics for autonomous workflows executed by the single Digital Human."
      icon={Workflow}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Approvals", value: "RBAC", hint: "Reused" },
          { label: "Retry policy", value: "Backoff", hint: "Reserved" },
          { label: "Rollback", value: "Safe", hint: "Reserved" },
          { label: "Monitor", value: "Live", hint: "Ready" },
        ],
        note: "Workflow runs stream to the monitor with approval, retry and rollback controls. Runtime activates with workflow-runtime-v3.",
      }}
    />
  ),
});
