import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/memory/dashboard")({
  head: () => ({ meta: [{ title: "Memory Dashboard — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Memory Dashboard"
      description="Overview of memory scopes, recall accuracy, compression health, and per-domain freshness."
      bullets={["Scope health", "Recall accuracy", "Compression health", "Freshness by domain", "Top recalled memories", "Ranking distribution"]}
      apiHints={["apiMemoryAnalytics", "apiMemoryList", "apiMemoryCompress"]}
    />
  ),
});
