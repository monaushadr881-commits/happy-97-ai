import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LiveShell } from "./-shell";
import { Panel, EmptyState } from "@/design-system/primitives";
import { listRecentEvents } from "@/lib/happy-presence/live-context.functions";
import { listProactive } from "@/lib/happy-presence/proactive-ai.functions";

export const Route = createFileRoute("/_authenticated/live/activity")({ component: ActivityPage });

function ActivityPage() {
  const evFn = useServerFn(listRecentEvents);
  const proFn = useServerFn(listProactive);
  const { data: events } = useQuery({ queryKey: ["hpe", "activity", "events"], queryFn: () => evFn(), refetchInterval: 10_000 });
  const { data: pro } = useQuery({ queryKey: ["hpe", "activity", "pro"], queryFn: () => proFn(), refetchInterval: 10_000 });
  return (
    <LiveShell title="Live Activity" description="Recent activity and HAPPY-initiated messages.">
      <div className="grid gap-6 md:grid-cols-2">
        <Panel className="p-6">
          <h3 className="text-sm font-semibold text-paper mb-2">Events</h3>
          {(events?.events ?? []).length === 0 ? <EmptyState title="No events yet" /> : (
            <ul className="text-xs space-y-1">
              {events!.events.map((e: any) => (
                <li key={e.id} className="border-t border-white/5 py-1"><span className="text-paper">{e.event_type}</span> <span className="text-soft-gray ml-2">{new Date(e.created_at).toLocaleString()}</span></li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="p-6">
          <h3 className="text-sm font-semibold text-paper mb-2">HAPPY Messages</h3>
          {(pro?.messages ?? []).length === 0 ? <EmptyState title="No messages yet" /> : (
            <ul className="text-xs space-y-1">
              {pro!.messages.map((m: any) => (
                <li key={m.id} className="border-t border-white/5 py-1">
                  <div className="text-paper">{m.message}</div>
                  <div className="text-soft-gray">{m.kind} · {new Date(m.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </LiveShell>
  );
}
