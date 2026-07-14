/** /search-v2 — Universal Search 2.0 · v13.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { SearchCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/search-v2")({
  head: () => ({ meta: [{ title: "Universal Search 2.0 — HAPPY v13.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Universal Search 2.0 · v13.0"
      title="Universal Search 2.0"
      description="Enterprise, knowledge, business, document, code, image, voice and universal search."
      icon={SearchCheck}
      features={["Enterprise","Knowledge","Business","Document","Code","Image","Voice","Universal"]}
    />
  ),
});
