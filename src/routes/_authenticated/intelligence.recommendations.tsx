import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Recommendation Engine"
      description="Actionable recommendations ranked by impact, confidence and effort."
      bullets={["Impact ranking", "Confidence score", "Effort estimate", "Cross-domain merge", "Approval hand-off", "Execution hand-off"]}
      apiHints={["apiEiRecommend"]}
    />
  ),
});
