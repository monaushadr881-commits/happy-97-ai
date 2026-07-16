import { createFileRoute } from "@tanstack/react-router";
import { ProductionShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/production/quality")({
  head: () => ({ meta: [{ title: "Code Quality" }] }),
  component: () => (
    <ProductionShell title="Quality" description="Dead code · duplicate logic · unused imports · circular deps · large files.">
      <p className="text-soft-gray">Aggregated read-only surface — no auto-fix.</p>
    </ProductionShell>
  ),
});
