import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/comfort")({
  head: () => ({ meta: [{ title: "HAPPY Comfort Engine" }] }),
  component: () => (
    <HappyShell title="Comfort Engine" description="Never covers modals, CTAs, form controls, toasts, or sticky headers.">
      <p className="text-soft-gray">Every 400 ms the stage re-checks overlap and slides to the nearest safe anchor.</p>
    </HappyShell>
  ),
});
