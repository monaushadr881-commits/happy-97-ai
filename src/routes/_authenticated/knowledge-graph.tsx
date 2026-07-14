/** /knowledge-graph — Global Knowledge Graph · v12.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Network } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/knowledge-graph")({
  head: () => ({ meta: [{ title: "Global Knowledge Graph — HAPPY v12.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Knowledge Graph · v12.0"
      title="Global Knowledge Graph"
      description="Entity, relationship, citation, business, education, healthcare, industrial, government and global graphs."
      icon={Network}
      features={["Knowledge","Entity","Relationship","Citation","Business","Education","Healthcare","Industrial","Government","Global"]}
    />
  ),
});
