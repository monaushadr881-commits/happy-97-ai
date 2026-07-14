/** /search-hub — Universal Search Fabric · v16.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/search-hub")({
  head: () => ({ meta: [{ title: "Universal Search Fabric — HAPPY v16.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Universal Search Fabric · v16.0"
      title="Universal Search Fabric"
      description="Semantic, enterprise, knowledge, document, media, people, workspace search and universal discovery."
      icon={Search}
      features={["Semantic","Enterprise","Knowledge","Document","Media","People","Workspace","Discovery"]}
    />
  ),
});
