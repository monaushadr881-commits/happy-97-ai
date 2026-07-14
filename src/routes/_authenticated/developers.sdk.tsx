import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/developers/sdk")({
  head: () => ({ meta: [{ title: "SDK Manager — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="SDK Manager"
      description="Official HAPPY SDKs, install snippets, changelogs and version pinning."
      bullets={["TypeScript SDK", "Python SDK", "Go SDK", "Install snippets", "Version pinning", "Changelog"]}
      apiHints={["apiDevListSdks"]}
    />
  ),
});
