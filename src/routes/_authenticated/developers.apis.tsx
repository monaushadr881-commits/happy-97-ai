import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/developers/apis")({
  head: () => ({ meta: [{ title: "API Explorer — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="API Explorer & Keys"
      description="Browse endpoints, mint scoped API keys, try requests in the sandbox."
      bullets={["Endpoint browser", "Scoped API keys", "Live sandbox", "Rate limit view", "Usage analytics", "Key rotation"]}
      apiHints={["apiDevListApis", "apiDevCreateApiKey", "apiDevRevokeApiKey", "apiDevUsage", "apiDevSandbox"]}
    />
  ),
});
