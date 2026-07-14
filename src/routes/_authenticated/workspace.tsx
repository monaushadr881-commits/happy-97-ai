/** /workspace — Universal Digital Workspace · v16.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({ meta: [{ title: "Universal Digital Workspace — HAPPY v16.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Universal Digital Workspace · v16.0"
      title="Universal Digital Workspace"
      description="Workspace hub, projects, documents, presentations, whiteboards, meetings, calendar, tasks, files, notes, bookmarks."
      icon={LayoutDashboard}
      features={["Hub","Projects","Documents","Presentations","Whiteboards","Meetings","Calendar","Tasks","Files","Notes","Bookmarks"]}
    />
  ),
});
