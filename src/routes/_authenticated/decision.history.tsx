import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/decision/history")({
  head: () => ({ meta: [{ title: "Decision History — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Decision History"
      description="Immutable log of every decision, its rationale, and downstream outcomes."
      bullets={["Full rationale", "Confidence at time", "Outcome tracking", "Rollback record", "Filter by domain", "Export"]}
      apiHints={["apiDecisionHistory"]}
    />
  ),
});
