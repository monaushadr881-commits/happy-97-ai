import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/workflows/monitor")({
  head: () => ({ meta: [{ title: "Workflow Monitor — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Workflow Monitor"
      description="Live monitor for active workflow runs, approvals, retries and rollbacks."
      bullets={["Active runs", "Approvals", "Retry", "Rollback", "Cancel", "Alerts"]}
      apiHints={["apiWrMonitor", "apiWrApprove", "apiWrRetry", "apiWrRollback", "apiWrCancel"]}
    />
  ),
});
