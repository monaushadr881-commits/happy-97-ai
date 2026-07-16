import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/cinematic")({
  head: () => ({ meta: [{ title: "HAPPY Cinematic Presence" }] }),
  component: () => (
    <HappyShell title="Cinematic Presence" description="VFX · particles · smoke · lighting · camera micro-motion.">
      <ul className="text-soft-gray space-y-2 list-disc pl-6">
        <li>Quality tiers: ultra · high · medium · low · auto</li>
        <li>Respects prefers-reduced-motion</li>
        <li>60 fps target · GPU-composited · zero CLS</li>
      </ul>
    </HappyShell>
  ),
});
