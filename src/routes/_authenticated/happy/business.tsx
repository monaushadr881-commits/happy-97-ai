import { createFileRoute } from "@tanstack/react-router";
import { HappyShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/happy/business")({
  head: () => ({ meta: [{ title: "HAPPY Business Advisor" }] }),
  component: () => (
    <HappyShell title="Business Advisor" description="Rule-based suggestions over live metrics — revenue, SEO, UI, performance, opportunity.">
      <p className="text-soft-gray">High-impact items sort first. Phrasing may be refined by Lovable AI at call time.</p>
    </HappyShell>
  ),
});
