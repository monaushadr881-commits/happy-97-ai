import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Connect"
      title="Community"
      icon={Users}
      description="Verified spaces for humans, brands and enterprises to gather, share and learn — moderated with intelligence, not noise."
      features={["Verified Spaces", "Moderation AI", "Events", "Threads", "Direct Messages", "Reputation", "Brand Rooms"]}
    />
  ),
});
