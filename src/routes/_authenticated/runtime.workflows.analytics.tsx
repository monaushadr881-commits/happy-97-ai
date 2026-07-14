import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/workflows/analytics")({
  head: () => ({ meta: [{ title: "Workflow Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Workflow Analytics"
      description="Status distribution, average step count and workflow health across the autonomous workflow runtime."
      bullets={["Status distribution", "Average steps", "Success rate", "Live runs", "Health"]}
      apiHints={["apiWfAnalytics", "apiWfHealth", "apiWfTimeline"]}
    />
  ),
});
