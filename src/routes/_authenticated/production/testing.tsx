import { createFileRoute } from "@tanstack/react-router";
import { ProductionShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/production/testing")({
  head: () => ({ meta: [{ title: "Testing Coverage" }] }),
  component: () => (
    <ProductionShell title="Testing" description="Unit · route smoke · a11y · Playwright flows.">
      <p className="text-soft-gray">See docs/testing/testing-strategy.md.</p>
    </ProductionShell>
  ),
});
