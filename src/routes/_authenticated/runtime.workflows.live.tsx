import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/workflows/live")({
  head: () => ({ meta: [{ title: "Workflow Runtime Live — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Live Workflows"
      description="Streaming view of in-flight workflow runs, current step, pending approvals and health."
      bullets={["In-flight runs", "Current step", "Pending approvals", "Failures", "Retry state", "Health"]}
      apiHints={["apiWr3Live", "apiWr3Monitor", "apiWr3Approve", "apiWr3Retry", "apiWr3Rollback"]}
    />
  ),
});
