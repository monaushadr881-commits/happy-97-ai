import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/risks")({
  head: () => ({ meta: [{ title: "Runtime Risks — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Risks"
      description="Live risk register: planner-detected risks, escalations, mitigations and required approvals."
      bullets={["Live risk register", "Severity", "Owner capability", "Mitigations", "Required approvals", "Escalations"]}
      apiHints={["apiPlanRisks", "apiPlanAssessRisk"]}
    />
  ),
});
