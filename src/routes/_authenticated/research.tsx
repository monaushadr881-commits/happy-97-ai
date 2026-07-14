/** /research — Research Hub · v15.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Microscope } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "Research Hub — HAPPY v15.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Research Hub · v15.0"
      title="Research Hub"
      description="Research hub, innovation lab, patent workspace, experiment tracking, collaboration, publications, analytics."
      icon={Microscope}
      features={["Research Hub","Innovation Lab","Patents","Experiments","Collaboration","Publications","Analytics"]}
    />
  ),
});
