import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/memory")({
  head: () => ({ meta: [{ title: "HAPPY Project Memory" }] }),
  component: () => (
    <HappyShell title="Project Memory" description="Recent projects, pending work, natural resume suggestions.">
      <p className="text-soft-gray">Persistence delegated to existing memory modules; this surface only ranks what to recall next.</p>
    </HappyShell>
  ),
});
