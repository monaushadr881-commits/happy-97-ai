/** /settings-background — UVE v4.0 · Live background engine. */
import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/settings-background")({
  head: () => ({ meta: [{ title: "Background — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate Visual Experience · v4.0"
      title="Live Background"
      description="Aurora, mesh gradients, floating particles, bokeh, light rays, parallax and interactive mouse glow. GPU-only, 60 fps."
      icon={Layers}
      features={["Aurora","Mesh gradient","Particles","Bokeh","Light rays","Parallax","Mouse glow","Depth layers","Floating shapes","Reflections"]}
    />
  ),
});
