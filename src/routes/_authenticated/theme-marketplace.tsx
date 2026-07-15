/** /theme-marketplace — UVE v4.0 · Theme marketplace. */
import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/theme-marketplace")({
  head: () => ({ meta: [{ title: "Theme Marketplace — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate Visual Experience · v4.0"
      title="Theme Marketplace"
      description="Browse, preview, install and publish premium and free themes from HAPPY Studio and the community."
      icon={Store}
      features={["Browse","Preview","Install","Purchase","Download","Upload","Publish","Rate","Review"]}
    />
  ),
});
