import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/office")({
  head: () => ({ meta: [{ title: "HAPPY Office Behaviour" }] }),
  component: () => (
    <HappyShell title="Office Behaviour" description="Idle breath · blink · glance · look-away · posture · finger relax.">
      <p className="text-soft-gray">Deterministic weighted pool with per-action cooldowns; behaviour never loops visibly.</p>
    </HappyShell>
  ),
});
