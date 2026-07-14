import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/developers/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Webhook Manager"
      description="Subscribe endpoints to HAPPY events with HMAC signing, retries, and delivery logs."
      bullets={["Event subscriptions", "HMAC signing", "Retry policy", "Delivery logs", "Replay failed", "OAuth client links"]}
      apiHints={["apiDevListWebhooks", "apiDevCreateWebhook", "apiDevDeleteWebhook", "apiDevOAuthClients"]}
    />
  ),
});
