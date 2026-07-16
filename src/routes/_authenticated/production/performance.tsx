import { createFileRoute } from "@tanstack/react-router";
import { ProductionShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/production/performance")({
  head: () => ({ meta: [{ title: "Performance Audit" }] }),
  component: () => (
    <ProductionShell title="Performance" description="LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1 · TBT ≤ 200ms · route JS ≤ 180KB.">
      <p className="text-soft-gray">See docs/performance/performance-guide.md.</p>
    </ProductionShell>
  ),
});
