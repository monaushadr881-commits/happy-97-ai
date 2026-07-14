import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/tools/analytics")({
  head: () => ({ meta: [{ title: "Tool Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Tool Analytics"
      description="Per-tool throughput, failure rate, average duration and top tools."
      bullets={["Throughput", "Failure rate", "Avg duration", "Top tools", "Catalog size"]}
      apiHints={["apiToolEngineAnalytics", "apiToolEngineMetrics", "apiToolEngineHealth"]}
    />
  ),
});
