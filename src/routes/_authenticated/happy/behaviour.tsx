import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/behaviour")({
  head: () => ({ meta: [{ title: "HAPPY Behaviour" }] }),
  component: () => (
    <HappyShell title="Behaviour" description="Micro expressions · body language · smart looking · proactive help.">
      <p className="text-soft-gray">Proactive help fires only on real confusion signals: long idle, repeat-click, repeat back-nav, form rejects, repeat errors.</p>
    </HappyShell>
  ),
});
