import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/timeline")({
  head: () => ({ meta: [{ title: "Runtime Timeline — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Timeline"
      description="Planned and executed capability activity on a unified timeline."
      bullets={["Planned tasks", "Executed tasks", "Milestones", "Approvals", "Rollbacks", "Retries"]}
      apiHints={["apiPlanTimeline", "apiWr3Timeline"]}
    />
  ),
});
