import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/workflows/runtime")({
  head: () => ({ meta: [{ title: "Workflow Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Workflow Runtime"
      description="Live workflow runtime: queue, background tasks, automation rules, scheduling and notifications."
      bullets={["Queue", "Background tasks", "Automation rules", "Scheduling", "Notifications", "Audit"]}
      apiHints={["apiWrStatus", "apiWrSchedule", "apiWrNotify"]}
    />
  ),
});
