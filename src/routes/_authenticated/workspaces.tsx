/** /workspaces — UUE v5.0 · Multi-workspace platform. */
import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/workspaces")({
  head: () => ({ meta: [{ title: "Workspaces — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate User Experience · v5.0"
      title="Workspaces"
      description="Multi-window workspace with split screen, resizable panels, floating windows, snapshots and templates for every persona."
      icon={LayoutGrid}
      features={["Split screen","Resizable panels","Floating windows","Snapshots","Restore","Tabs","Templates"]}
    />
  ),
});
