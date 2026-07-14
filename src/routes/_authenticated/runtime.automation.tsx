import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/automation")({
  head: () => ({ meta: [{ title: "Automation Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Automation Runtime"
      description="Background jobs, task scheduler, notifications, approval chains, workflow automation, execution history and automation analytics."
      bullets={["Background Jobs", "Scheduler", "Notifications", "Approval Chains", "Workflow Automation", "History", "Analytics"]}
      apiHints={["automationRuntimeService", "apiAutomationStatus"]}
    />
  ),
});
