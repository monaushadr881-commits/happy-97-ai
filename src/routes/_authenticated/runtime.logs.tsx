import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/logs")({
  head: () => ({ meta: [{ title: "Runtime Logs — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Runtime Logs"
      description="Structured logs for capability dispatch, tool calls, workflow steps and decisions — audit-integrated."
      bullets={["Capability logs", "Tool logs", "Workflow logs", "Decision logs", "Approval logs", "Security logs"]}
      apiHints={["logsRuntimeService", "apiLogsStatus"]}
    />
  ),
});
