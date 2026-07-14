import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/workflows/history")({
  head: () => ({ meta: [{ title: "Workflow Runtime History — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Workflow History"
      description="Historic workflow runs with outcomes, approvals, retries, rollbacks and analytics."
      bullets={["Historic runs", "Outcome", "Approvals", "Retries", "Rollbacks", "Analytics"]}
      apiHints={["apiWr3History", "apiWr3Timeline", "apiWr3Analytics"]}
    />
  ),
});
