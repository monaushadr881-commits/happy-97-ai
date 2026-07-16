import { createFileRoute } from "@tanstack/react-router";
import { ProductionShell } from "./-shell";

export const Route = createFileRoute("/_authenticated/production/deployment")({
  head: () => ({ meta: [{ title: "Deployment Readiness" }] }),
  component: () => (
    <ProductionShell title="Deployment" description="Domain · SSL · CDN · monitoring · rollback · backups · store readiness.">
      <p className="text-soft-gray">See docs/deployment/production-deployment.md. Store submissions blocked pending credentials — see R64.</p>
    </ProductionShell>
  ),
});
