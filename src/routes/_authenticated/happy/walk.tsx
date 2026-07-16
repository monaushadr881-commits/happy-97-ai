import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/walk")({
  head: () => ({ meta: [{ title: "HAPPY Walking Engine" }] }),
  component: () => (
    <HappyShell title="Walking Engine" description="Weight shift · foot placement · shoulder & arm swing · natural stop.">
      <p className="text-soft-gray">Walking is a presentation-layer animation. It reads the dock position and target and plans a natural path.</p>
    </HappyShell>
  ),
});
