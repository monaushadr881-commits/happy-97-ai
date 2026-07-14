import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/executive")({
  head: () => ({ meta: [{ title: "Executive Intelligence — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Executive Intelligence"
      description="Board-level briefing composed from revenue, market, customer, operations, manufacturing and learning intelligence."
      bullets={["Executive summary", "KPI briefing", "Risk digest", "Growth digest", "Cross-domain merge", "Confidence & sources"]}
      apiHints={["apiIrExecutiveSummary", "apiIrInsights"]}
    />
  ),
});
