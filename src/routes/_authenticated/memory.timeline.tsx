import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/memory/timeline")({
  head: () => ({ meta: [{ title: "Memory Timeline — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Memory Timeline"
      description="Chronological view of learned facts, decisions, preferences and conversations."
      bullets={["Chronological view", "Filter by scope", "Filter by domain", "Version history", "Expiry markers", "Relationship links"]}
      apiHints={["apiMemoryTimeline"]}
    />
  ),
});
