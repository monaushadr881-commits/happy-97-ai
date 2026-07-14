import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/reports")({
  head: () => ({ meta: [{ title: "Reports — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Executive Reports"
      description="Board-ready reports auto-drafted from live metrics and AI narrative."
      bullets={["Weekly board pack", "Monthly review", "Investor update", "Ops report", "AI narrative", "Export to PDF"]}
      apiHints={["apiIntelReports"]}
    />
  ),
});
