import { createFileRoute } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/studio")({
  head: () => ({ meta: [{ title: "Creator Studio — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Create"
      title="Creator Studio"
      icon={Palette}
      description="Design, video, audio, copywriting and brand systems — an AI-augmented studio for teams and independent creators."
      features={["Design Canvas", "Video Editor", "Audio Suite", "Brand System", "Copywriting", "Asset Library", "Templates", "Collaboration", "Publishing"]}
    />
  ),
});
