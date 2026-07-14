import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/developers")({
  head: () => ({ meta: [{ title: "Developer Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Developer Runtime"
      description="SDK, API explorer, webhooks, OAuth, developer portal, sandbox, API keys, analytics and documentation."
      bullets={["SDK", "API Explorer", "Webhooks", "OAuth", "Portal", "Sandbox", "API Keys", "Analytics", "Documentation"]}
      apiHints={["developersRuntimeService", "apiDevelopersStatus"]}
    />
  ),
});
