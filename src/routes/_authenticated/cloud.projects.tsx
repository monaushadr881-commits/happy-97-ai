/** /cloud/projects — v5.0 Cloud Projects surface. */
import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/cloud/projects")({
  head: () => ({ meta: [{ title: "Cloud Projects — HAPPY v5.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Cloud Platform · v5.0"
      title="Cloud Projects"
      description="Multi-region project management, environments, secrets, runtime and storage — orchestrated through the Enterprise Cloud Console."
      icon={FolderKanban}
      features={[
        "Projects",
        "Environments",
        "Secrets",
        "Runtimes",
        "Storage",
        "Multi-Region",
        "AI Compute",
        "Team Access",
        "Project Analytics",
      ]}
    />
  ),
});
