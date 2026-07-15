/** /live-island — UUE v5.0 · AI Live Island status bar. */
import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/live-island")({
  head: () => ({ meta: [{ title: "Live Island — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate User Experience · v5.0"
      title="AI Live Island"
      description="Floating status bar surfacing thinking, listening, speaking, generating, uploading, deploying, notifications, voice, credits and network in one place."
      icon={Radio}
      features={["Thinking","Listening","Speaking","Generating","Uploading","Deploying","Notifications","Voice","Credits","Network","Realtime"]}
    />
  ),
});
