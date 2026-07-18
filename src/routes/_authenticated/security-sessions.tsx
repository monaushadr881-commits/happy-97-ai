/**
 * R114 — Security & Sessions page.
 * Extends the settings surface. Shows devices, active sessions, login history,
 * and security alerts. Wires remote-logout + trust-device actions.
 * Owner per R111: single settings page for auth extension.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Container } from "@/design-system/primitives";
import {
  listMyDevices, listMySessions, listMyLoginHistory, listMySecurityAlerts,
  trustDevice, revokeDevice, remoteLogout, acknowledgeSecurityAlert,
  getEffectiveSessionPolicy,
} from "@/lib/happy-id.functions";

export const Route = createFileRoute("/_authenticated/security-sessions")({
  head: () => ({ meta: [
    { title: "Security & Sessions — HAPPY X" },
    { name: "robots", content: "noindex" },
  ]}),
  component: SecuritySessionsPage,
});

function SecuritySessionsPage() {
  const qc = useQueryClient();
  const fetchDevices = useServerFn(listMyDevices);
  const fetchSessions = useServerFn(listMySessions);
  const fetchHistory = useServerFn(listMyLoginHistory);
  const fetchAlerts = useServerFn(listMySecurityAlerts);
  const fetchPolicy = useServerFn(getEffectiveSessionPolicy);
  const trust = useServerFn(trustDevice);
  const revoke = useServerFn(revokeDevice);
  const logout = useServerFn(remoteLogout);
  const ack = useServerFn(acknowledgeSecurityAlert);

  const devices = useQuery({ queryKey: ["auth","devices"], queryFn: () => fetchDevices() });
  const sessions = useQuery({ queryKey: ["auth","sessions"], queryFn: () => fetchSessions() });
  const history = useQuery({ queryKey: ["auth","history"], queryFn: () => fetchHistory() });
  const alerts = useQuery({ queryKey: ["auth","alerts"], queryFn: () => fetchAlerts() });
  const policy = useQuery({ queryKey: ["auth","policy"], queryFn: () => fetchPolicy() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["auth"] });
  };

  const trustMut = useMutation({ mutationFn: (v: { device_id: string; trusted: boolean }) => trust({ data: v }), onSuccess: invalidate });
  const revokeMut = useMutation({ mutationFn: (v: { device_id: string }) => revoke({ data: v }), onSuccess: invalidate });
  const logoutMut = useMutation({ mutationFn: (v: { session_id: string }) => logout({ data: v }), onSuccess: invalidate });
  const ackMut = useMutation({ mutationFn: (v: { alert_id: string }) => ack({ data: v }), onSuccess: invalidate });

  return (
    <Container className="py-6 md:py-10 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Security &amp; Sessions</h1>
        <p className="text-sm text-muted-foreground">HAPPY ID — manage your devices, sessions, and security signals.</p>
      </header>

      <section className="rounded-xl border p-4">
        <h2 className="font-medium mb-2">Session policy</h2>
        <div className="text-sm text-muted-foreground grid gap-1">
          <div>Max active sessions: <b>{policy.data?.max_active_sessions ?? "…"}</b></div>
          <div>Require trusted device: <b>{String(policy.data?.require_trusted_device ?? false)}</b></div>
          <div>Idle timeout: <b>{policy.data?.idle_timeout_minutes ?? "…"} min</b></div>
          <div>Allowed providers: <b>{(policy.data?.allowed_providers ?? []).join(", ")}</b></div>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-medium mb-2">Security alerts</h2>
        {alerts.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        <ul className="divide-y">
          {(alerts.data ?? []).filter(a => !a.acknowledged_at).map((a) => (
            <li key={a.id} className="py-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{a.alert_type} · <span className="text-xs uppercase">{a.severity}</span></div>
                <div className="text-sm text-muted-foreground">{a.message}</div>
                <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
              </div>
              <button className="text-xs px-2 py-1 rounded border" onClick={() => ackMut.mutate({ alert_id: a.id })}>Acknowledge</button>
            </li>
          ))}
          {(alerts.data ?? []).filter(a => !a.acknowledged_at).length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">No unacknowledged alerts.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-medium mb-2">Active sessions</h2>
        <ul className="divide-y">
          {(sessions.data ?? []).filter(s => !s.ended_at).map((s) => (
            <li key={s.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm truncate">{s.user_agent ?? "Unknown device"}</div>
                <div className="text-xs text-muted-foreground">last active {new Date(s.last_active_at).toLocaleString()}</div>
              </div>
              <button className="text-xs px-2 py-1 rounded border" onClick={() => logoutMut.mutate({ session_id: s.id })}>Sign out</button>
            </li>
          ))}
          {(sessions.data ?? []).filter(s => !s.ended_at).length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">No active sessions tracked yet.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-medium mb-2">Devices</h2>
        <ul className="divide-y">
          {(devices.data ?? []).map((d) => (
            <li key={d.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm">{d.device_name ?? d.device_fingerprint.slice(0,12)} · {d.os ?? "?"} · {d.browser ?? "?"}</div>
                <div className="text-xs text-muted-foreground">
                  {d.trusted ? "Trusted · " : ""}{d.revoked_at ? "Revoked" : `last seen ${new Date(d.last_seen_at).toLocaleString()}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!d.revoked_at && (
                  <>
                    <button className="text-xs px-2 py-1 rounded border" onClick={() => trustMut.mutate({ device_id: d.id, trusted: !d.trusted })}>
                      {d.trusted ? "Untrust" : "Trust"}
                    </button>
                    <button className="text-xs px-2 py-1 rounded border" onClick={() => revokeMut.mutate({ device_id: d.id })}>Revoke</button>
                  </>
                )}
              </div>
            </li>
          ))}
          {(devices.data ?? []).length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">No devices recorded yet.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-medium mb-2">Login history</h2>
        <ul className="divide-y max-h-96 overflow-auto">
          {(history.data ?? []).map((h) => (
            <li key={h.id} className="py-2 flex items-center justify-between gap-3 text-sm">
              <div>
                <span className="font-medium">{h.event_type}</span>
                {h.provider ? <span className="text-muted-foreground"> · {h.provider}</span> : null}
                {h.success ? null : <span className="text-red-600"> · failed</span>}
              </div>
              <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
            </li>
          ))}
          {(history.data ?? []).length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">No history recorded yet.</li>
          )}
        </ul>
      </section>
    </Container>
  );
}
