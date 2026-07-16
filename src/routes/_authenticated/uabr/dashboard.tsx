import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UabrShell } from "./-shell";
import { Panel, StatCard, Chip } from "@/design-system/primitives";
import { getBuilderStatus } from "@/lib/uabr/builder-runtime.functions";

export const Route = createFileRoute("/_authenticated/uabr/dashboard")({ component: Page });

function Page() {
  const fn = useServerFn(getBuilderStatus);
  const { data, isLoading, error } = useQuery({ queryKey: ["uabr", "status"], queryFn: () => fn() });
  return (
    <UabrShell title="AI Software Factory" description="Describe an idea in natural language. HAPPY plans, designs, generates, validates, and readies it for deployment.">
      {isLoading && <Panel className="p-6 text-soft-gray text-sm">Loading…</Panel>}
      {error && <Panel className="p-6 text-red-400 text-sm">{(error as Error).message}</Panel>}
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Runtime" value={data.version} />
            <StatCard label="Engines" value={String(data.engines.length)} />
            <StatCard label="Auto mode" value={data.auto_mode} />
            <StatCard label="Approval required" value={data.approval_required ? "Yes" : "No"} />
          </div>
          <Panel className="p-6 space-y-3">
            <h3 className="text-sm font-semibold text-paper">Engines</h3>
            <div className="flex flex-wrap gap-2">
              {data.engines.map((e: string) => <Chip key={e} tone="info">{e}</Chip>)}
            </div>
          </Panel>
          <Panel className="p-6 space-y-2 text-sm text-soft-gray">
            <h3 className="text-sm font-semibold text-paper">Blocked by default</h3>
            <div className="flex flex-wrap gap-2">
              {data.blocked_by_default.map((b: string) => <Chip key={b} tone="warning">{b}</Chip>)}
            </div>
            <p className="text-xs">Native builds &amp; store publishing require external toolchains + credentials — planned but never faked.</p>
          </Panel>
        </div>
      )}
    </UabrShell>
  );
}
