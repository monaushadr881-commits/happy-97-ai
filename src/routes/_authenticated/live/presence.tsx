import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LiveShell } from "./-shell";
import { Panel, Chip, StatCard } from "@/design-system/primitives";
import { getMyPresence, upsertPresence, heartbeat } from "@/lib/happy-presence/presence-engine.functions";
import { HEARTBEAT_INTERVAL_MS } from "@/lib/happy-presence/contracts";

export const Route = createFileRoute("/_authenticated/live/presence")({ component: PresencePage });

const SESSION_KEY_STORAGE = "hpe:session_key";

function PresencePage() {
  const getFn = useServerFn(getMyPresence);
  const upsertFn = useServerFn(upsertPresence);
  const beatFn = useServerFn(heartbeat);

  const { data } = useQuery({ queryKey: ["hpe", "me"], queryFn: () => getFn(), refetchInterval: 10_000 });
  const upsert = useMutation({ mutationFn: (v: any) => upsertFn({ data: v }) });
  const beat = useMutation({ mutationFn: (v: any) => beatFn({ data: v }) });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let key = window.localStorage.getItem(SESSION_KEY_STORAGE);
    if (!key) { key = crypto.randomUUID(); window.localStorage.setItem(SESSION_KEY_STORAGE, key); }
    const device = { ua: navigator.userAgent, lang: navigator.language, screen: `${window.innerWidth}x${window.innerHeight}` };
    const network = { online: navigator.onLine };
    upsert.mutate({ session_key: key, state: "online", device, network });
    const t = setInterval(() => beat.mutate({ session_key: key!, state: "online" }), HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LiveShell title="Live Presence" description="Your live sessions and current HAPPY state.">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Active State" value={data?.active_state ?? "—"} />
        <StatCard label="Sessions" value={String(data?.sessions.length ?? 0)} />
      </div>
      <Panel className="p-6 mt-6">
        <h3 className="text-sm font-semibold text-paper mb-3">Sessions</h3>
        <table className="w-full text-xs">
          <thead className="text-soft-gray text-left"><tr><th className="py-1">Session</th><th>State</th><th>Last Heartbeat</th><th>Status</th></tr></thead>
          <tbody>
            {data?.sessions.map((s: any) => (
              <tr key={s.id} className="border-t border-white/5">
                <td className="py-1 text-paper">{String(s.session_key).slice(0, 8)}…</td>
                <td><Chip tone={s.state === "offline" ? "warning" : "success"}>{s.state}</Chip></td>
                <td className="text-soft-gray">{new Date(s.last_heartbeat).toLocaleTimeString()}</td>
                <td>{s.is_stale ? <Chip tone="warning">stale</Chip> : <Chip tone="success">live</Chip>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </LiveShell>
  );
}
