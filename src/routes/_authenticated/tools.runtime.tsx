import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/tools/runtime")({
  head: () => ({ meta: [{ title: "Tool Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Tool Runtime"
      description="Live tool dispatch, validation and health monitor across enterprise tool families."
      bullets={["Discovery", "Execution", "Validation", "Permissions", "Health", "Audit"]}
      apiHints={["apiTrList", "apiTrDiscover", "apiTrExecute", "apiTrValidate", "apiTrPermissions", "apiTrHealth"]}
    />
  ),
});
