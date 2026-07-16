import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/initiative")({
  head: () => ({ meta: [{ title: "HAPPY Initiative AI" }] }),
  component: () => (
    <HappyShell title="Initiative AI" description="Proactive, cooldown-gated suggestions — never spam.">
      <p className="text-soft-gray">Signals are ranked by relevance; only the highest surfaces, then Happy stays quiet for 90 seconds.</p>
    </HappyShell>
  ),
});
