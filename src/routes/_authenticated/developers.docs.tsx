import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/developers/docs")({
  head: () => ({ meta: [{ title: "Developer Docs — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Developer Documentation"
      description="Guides, reference, tutorials, and cookbooks for building on HAPPY."
      bullets={["Quickstarts", "Reference", "Auth & OAuth", "Webhook cookbook", "Plugin authoring", "Best practices"]}
      apiHints={["apiDevDocsIndex"]}
    />
  ),
});
