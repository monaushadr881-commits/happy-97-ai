/** /zen — UUE v5.0 · Zen Mode. */
import { createFileRoute } from "@tanstack/react-router";
import { Waves } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/zen")({
  head: () => ({ meta: [{ title: "Zen — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate User Experience · v5.0"
      title="Zen Mode"
      description="Nature, aurora, rain, forest, ocean, night, library and coffee-shop ambient scenes with matching soundscapes."
      icon={Waves}
      features={["Nature","Aurora","Rain","Forest","Ocean","Night","Library","Coffee shop","Ambient sound"]}
    />
  ),
});
