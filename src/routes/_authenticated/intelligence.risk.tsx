import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/risk")({
  head: () => ({ meta: [{ title: "Risk Intelligence — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Risk Intelligence"
      description="Detect, rank and monitor enterprise risk across operations, finance, security and customer signals."
      bullets={["Risk registry", "Severity ranking", "Trend anomalies", "Mitigation actions", "Owner routing", "Audit trail"]}
      apiHints={["apiIrAnalyzeRisk", "apiIrTrends", "apiIrPriority"]}
    />
  ),
});
