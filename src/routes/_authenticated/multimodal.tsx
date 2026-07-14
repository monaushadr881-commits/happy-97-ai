/** /multimodal — Voice & Multimodal · v11.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Mic } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/multimodal")({
  head: () => ({ meta: [{ title: "Voice & Multimodal — HAPPY v11.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Voice & Multimodal · v11.0"
      title="Voice & Multimodal"
      description="Voice, camera, gesture and touch commands, multimodal fusion and speech analytics."
      icon={Mic}
      features={["Voice","Camera","Gesture","Touch","Fusion","Speech"]}
    />
  ),
});
