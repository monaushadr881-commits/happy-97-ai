/** /icons — UUE v5.0 · Icon marketplace. */
import { createFileRoute } from "@tanstack/react-router";
import { Shapes } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/icons")({
  head: () => ({ meta: [{ title: "Icons — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate User Experience · v5.0"
      title="Icon Marketplace"
      description="Premium, business, minimal, 3D and animated icon packs."
      icon={Shapes}
      features={["Premium","Business","Minimal","3D","Animated"]}
    />
  ),
});
