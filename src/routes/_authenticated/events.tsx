/** /events — Global Event Platform · v14.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Global Event Platform — HAPPY v14.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Event Platform · v14.0"
      title="Global Event Platform"
      description="Event bus, realtime events, notifications, subscriptions, webhooks, streaming and analytics."
      icon={Radio}
      features={["Bus","Realtime","Notifications","Subscriptions","Webhooks","Streaming","Analytics"]}
    />
  ),
});
