import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReleasePageShell } from "./-shell";
import { Panel, EmptyState } from "@/design-system/primitives";
import { listBuilds, listBuildEvents } from "@/lib/release-r64/build-pipeline-r64.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/releases/logs")({
  component: LogsPage,
});

function LogsPage() {
  const buildsFn = useServerFn(listBuilds);
  const eventsFn = useServerFn(listBuildEvents);
  const [selected, setSelected] = useState<string | null>(null);
  const builds = useQuery({ queryKey: ["r64", "builds-for-logs"], queryFn: () => buildsFn({ data: {} }) });
  const events = useQuery({
    queryKey: ["r64", "build-events", selected],
    queryFn: () => eventsFn({ data: { run_id: selected! } }),
    enabled: !!selected,
  });
  return (
    <ReleasePageShell title="Build Logs" description="Append-only event stream per build run.">
      <div className="grid gap-4 md:grid-cols-[280px,1fr]">
        <Panel className="p-3 max-h-[600px] overflow-auto">
          {(builds.data?.builds ?? []).map((b: any) => (
            <button
              key={b.id}
              onClick={() => setSelected(b.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs ${selected === b.id ? "bg-gold/10 text-gold" : "text-soft-gray hover:text-paper"}`}
            >
              <div>{b.platform_code}</div>
              <div className="text-[10px] opacity-70">{b.status} · {new Date(b.queued_at).toLocaleString()}</div>
            </button>
          ))}
        </Panel>
        <Panel className="p-4 min-h-[400px]">
          {!selected && <EmptyState title="Select a build to view logs" />}
          {selected && events.isLoading && <div className="text-sm text-soft-gray">Loading events…</div>}
          {selected && events.data && (
            <ol className="text-xs space-y-1 font-mono">
              {events.data.events.map((e: any) => (
                <li key={e.id} className="border-b border-white/5 py-1">
                  <span className="text-soft-gray">{new Date(e.created_at).toISOString()}</span>{" "}
                  <span className="text-gold">{e.event_type}</span>{" "}
                  <span className="text-paper">{e.message ?? ""}</span>
                </li>
              ))}
              {events.data.events.length === 0 && <li className="text-soft-gray">No events.</li>}
            </ol>
          )}
        </Panel>
      </div>
    </ReleasePageShell>
  );
}
