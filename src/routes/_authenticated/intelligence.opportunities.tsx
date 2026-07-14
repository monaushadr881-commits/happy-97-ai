import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Opportunity Engine"
      description="Ranked growth and optimization opportunities across the enterprise."
      bullets={["Growth signals", "Cost optimization", "Customer opportunities", "Market opportunities", "Effort vs impact", "Hand-off to execution"]}
      apiHints={["apiIrOpportunities", "apiIrOptimize", "apiIrRecommend"]}
    />
  ),
});
