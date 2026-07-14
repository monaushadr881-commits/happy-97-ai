import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/intelligence/advisor")({
  head: () => ({ meta: [{ title: "Executive Advisor — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Executive Advisor"
      description="Advisor runtime: contextual executive guidance derived from memory, planning and workflow state."
      bullets={["Advisor prompt", "Context digest", "Guidance", "Actions", "Audit trail"]}
      apiHints={["apiExecAdvisor", "apiExecDecide"]}
    />
  ),
});
