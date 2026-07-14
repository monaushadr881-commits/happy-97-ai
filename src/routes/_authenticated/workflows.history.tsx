import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/workflows/history")({
  head: () => ({ meta: [{ title: "Workflow History — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Run History"
      description="Every workflow run with status, timeline, approvals and retries."
      bullets={["Run timeline", "Status filters", "Retry from step", "Cancel running", "Approval log", "Export"]}
      apiHints={["apiWorkflowHistory", "apiWorkflowRetry", "apiWorkflowCancel", "apiWorkflowApprove"]}
    />
  ),
});
