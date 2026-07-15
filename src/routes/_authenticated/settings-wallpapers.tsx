/** /settings-wallpapers — UVE v4.0 · Wallpaper engine. */
import { createFileRoute } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/settings-wallpapers")({
  head: () => ({ meta: [{ title: "Wallpapers — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate Visual Experience · v4.0"
      title="Wallpapers"
      description="Curated, animated, video and AI-generated wallpapers across workspace, nature, space, luxury, spiritual and custom collections."
      icon={ImageIcon}
      features={["Workspace","Nature","Space","Abstract","Technology","Luxury","Spiritual","Custom","AI-generated","Animated","Video"]}
    />
  ),
});
