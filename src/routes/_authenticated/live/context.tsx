import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LiveShell } from "./-shell";
import { Panel, EmptyState } from "@/design-system/primitives";
import { getCurrentContext, recordContext, listRecentEvents } from "@/lib/happy-presence/live-context.functions";

export const Route = createFileRoute("/_authenticated/live/context")({ component: ContextPage });

function ContextPage() {
  const getCtxFn = useServerFn(getCurrentContext);
  const recFn = useServerFn(recordContext);
  const listFn = useServerFn(listRecentEvents);

  useEffect(() => {
    if (typeof window === "undefined") return;
    recFn({ data: { context: { path: window.location.pathname, title: document.title }, source: "context_page" } }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: current } = useQuery({ queryKey: ["hpe", "context"], queryFn: () => getCtxFn(), refetchInterval: 15_000 });
  const { data: events } = useQuery({ queryKey: ["hpe", "events"], queryFn: () => listFn(), refetchInterval: 15_000 });

  return (
    <LiveShell title="Live Context" description="What HAPPY currently understands about your session.">
      <Panel className="p-6 mb-6">
        <h3 className="text-sm font-semibold text-paper mb-2">Current Context</h3>
        <pre className="text-xs text-soft-gray overflow-x-auto">{JSON.stringify(current?.context ?? {}, null, 2)}</pre>
      </Panel>
      <Panel className="p-6">
        <h3 className="text-sm font-semibold text-paper mb-2">Recent Events</h3>
        {(events?.events ?? []).length === 0 ? <EmptyState title="No events" description="Interact with HAPPY to populate events." /> : (
          <ul className="space-y-1 text-xs">
            {events!.events.map((e: any) => (
              <li key={e.id} className="border-t border-white/5 py-1">
                <span className="text-paper">{e.event_type}</span>
                <span className="text-soft-gray ml-2">{new Date(e.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </LiveShell>
  );
}
