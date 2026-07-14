/** /search — Unified Search Engine · v12.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Unified Search Engine — HAPPY v12.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Unified Search Engine · v12.0"
      title="Unified Search Engine"
      description="Universal, semantic, enterprise, knowledge, business, research, media, people, document and voice search."
      icon={Search}
      features={["Universal","Semantic","Enterprise","Knowledge","Business","Research","Media","People","Document","Voice"]}
    />
  ),
});
