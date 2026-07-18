/**
 * /founder/integrations — R142 External Integration Readiness.
 * Read-only surface over `adapterReadinessFlat()`; every row is a canonical
 * adapter under `src/lib/happy-adapters/*`. No provider logic here — this is
 * the operations view for external wiring status.
 */
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { adapterReadinessFlat } from "@/lib/happy-adapters";


export const Route = createFileRoute("/_authenticated/founder/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderIntegrations,
});

function FounderIntegrations() {
  const rows = adapterReadinessFlat();
  const families = Array.from(new Set(rows.map((r) => r.family)));
  const configured = rows.filter((r) => r.configured).length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="External Integrations"
        description={`${configured} / ${rows.length} providers configured across ${families.length} families (R142)`}
      />
      <div className="grid gap-4">
        {families.map((family) => {
          const items = rows.filter((r) => r.family === family);
          return (
            <Panel key={family}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="font-medium capitalize">{family}</div>
                <Chip>{items.filter((i) => i.configured).length}/{items.length}</Chip>
              </div>
              <Hairline />
              <ul className="divide-y">
                {items.map((row) => (
                  <li key={row.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span className="font-mono">{row.id}</span>
                    <span className="flex items-center gap-2">
                      {row.configured ? (
                        <Chip tone="success">Connected</Chip>
                      ) : (
                        <Chip tone="neutral" title={`Missing: ${row.missing.join(", ")}`}>Pending</Chip>
                      )}
                      {row.missing.length > 0 && (
                        <span className="text-xs text-muted-foreground max-w-md truncate" title={row.missing.join(", ")}>
                          {row.missing.join(", ")}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
