import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/intelligence/recommendations")({
  head: () => ({ meta: [{ title: "Executive Recommendations — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Executive Recommendations"
      description="Live recommendation feed derived from runtime signals, opportunities and risks."
      bullets={["Live feed", "Rationale", "Impact", "Owner capability", "Accept / dismiss", "Audit"]}
      apiHints={["apiExecRecommend", "apiExecOpportunities", "apiExecRisks"]}
    />
  ),
});
