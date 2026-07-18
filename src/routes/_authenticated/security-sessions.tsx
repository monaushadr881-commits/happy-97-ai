/**
 * R114 / R114.3 — Security Center (single page, extends existing settings surface).
 * Sections: Trusted Devices, Current + Other Sessions, Emergency Lock,
 * Recovery Codes, Provider Status, Device Rename, Remote Logout,
 * Login History, Security Alerts, Privacy, Session Policy.
 *
 * Canonical owner per R111. NO duplicate auth UI.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Container } from "@/design-system/primitives";
import { getSessionKey } from "@/lib/happy-id/device";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyDevices, listMySessions, listMyLoginHistory, listMySecurityAlerts,
  trustDevice, revokeDevice, remoteLogout, acknowledgeSecurityAlert,
  getEffectiveSessionPolicy, setUserSessionPolicy,
  renameDevice, emergencyLock, emergencyUnlock,
  generateRecoveryCodes, listAvailableProviders,
} from "@/lib/happy-id.functions";

export const Route = createFileRoute("/_authenticated/security-sessions")({
  head: () => ({ meta: [
    { title: "Security Center — HAPPY X" },
    { name: "robots", content: "noindex" },
  ]}),
  component: SecurityCenterPage,
});

type Tab = "overview" | "devices" | "sessions" | "recovery" | "providers" | "history" | "privacy";

function SecurityCenterPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const qc = useQueryClient();

  const fetchDevices = useServerFn(listMyDevices);
  const fetchSessions = useServerFn(listMySessions);
  const fetchHistory = useServerFn(listMyLoginHistory);
  const fetchAlerts = useServerFn(listMySecurityAlerts);
  const fetchPolicy = useServerFn(getEffectiveSessionPolicy);
  const fetchProviders = useServerFn(listAvailableProviders);
  const trust = useServerFn(trustDevice);
  const revoke = useServerFn(revokeDevice);
  const rename = useServerFn(renameDevice);
  const logout = useServerFn(remoteLogout);
  const ack = useServerFn(acknowledgeSecurityAlert);
  const lock = useServerFn(emergencyLock);
  const unlock = useServerFn(emergencyUnlock);
  const setPolicy = useServerFn(setUserSessionPolicy);
  const genCodes = useServerFn(generateRecoveryCodes);

  const devices = useQuery({ queryKey: ["auth","devices"], queryFn: () => fetchDevices() });
  const sessions = useQuery({ queryKey: ["auth","sessions"], queryFn: () => fetchSessions() });
  const history = useQuery({ queryKey: ["auth","history"], queryFn: () => fetchHistory() });
  const alerts = useQuery({ queryKey: ["auth","alerts"], queryFn: () => fetchAlerts() });
  const policy = useQuery({ queryKey: ["auth","policy"], queryFn: () => fetchPolicy() });
  const providers = useQuery({ queryKey: ["auth","providers"], queryFn: () => fetchProviders() });

  const invalidate = () => { qc.invalidateQueries({ queryKey: ["auth"] }); };
  const err = (e: unknown) => toast.error(e instanceof Error ? e.message : "Action failed");
  const ok = (msg: string) => toast.success(msg);

  const trustMut = useMutation({ mutationFn: (v: { device_id: string; trusted: boolean }) => trust({ data: v }), onSuccess: () => { ok("Device updated"); invalidate(); }, onError: err });
  const revokeMut = useMutation({ mutationFn: (v: { device_id: string }) => revoke({ data: v }), onSuccess: () => { ok("Device revoked"); invalidate(); }, onError: err });
  const renameMut = useMutation({ mutationFn: (v: { device_id: string; device_name: string }) => rename({ data: v }), onSuccess: () => { ok("Renamed"); invalidate(); }, onError: err });
  const logoutMut = useMutation({ mutationFn: (v: { session_id: string }) => logout({ data: v }), onSuccess: () => { ok("Session signed out"); invalidate(); }, onError: err });
  const ackMut = useMutation({ mutationFn: (v: { alert_id: string }) => ack({ data: v }), onSuccess: invalidate, onError: err });
  const lockMut = useMutation({ mutationFn: () => lock({}), onSuccess: () => { ok("Emergency lock activated"); invalidate(); }, onError: err });
  const unlockMut = useMutation({ mutationFn: () => unlock({}), onSuccess: () => { ok("Devices unlocked"); invalidate(); }, onError: err });
  const policyMut = useMutation({ mutationFn: (v: Parameters<typeof setPolicy>[0]["data"]) => setPolicy({ data: v }), onSuccess: () => { ok("Policy updated"); invalidate(); }, onError: err });

  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const codesMut = useMutation({
    mutationFn: () => genCodes({}),
    onSuccess: (r) => { setRecoveryCodes(r.codes); ok("Recovery codes generated"); },
    onError: err,
  });

  return (
    <Container className="py-6 md:py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Security Center</h1>
        <p className="text-sm text-muted-foreground">HAPPY ID — devices, sessions, recovery, providers, and privacy.</p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b pb-2 text-sm">
        {(["overview","devices","sessions","recovery","providers","history","privacy"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md transition ${tab === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Session policy">
            <div className="text-sm grid gap-1">
              <Row k="Max active sessions" v={policy.data?.max_active_sessions ?? "—"} />
              <Row k="Require trusted device" v={String(policy.data?.require_trusted_device ?? false)} />
              <Row k="Idle timeout" v={`${policy.data?.idle_timeout_minutes ?? "—"} min`} />
              <Row k="Require MFA" v={String(policy.data?.require_mfa ?? false)} />
              <Row k="Allowed providers" v={(policy.data?.allowed_providers ?? []).join(", ") || "—"} />
              <Row k="Scope" v={policy.data?.scope_type ?? "platform"} />
            </div>
          </Card>
          <Card title="Emergency lock">
            <p className="text-sm text-muted-foreground mb-3">
              Immediately revokes all active sessions and trust flags on every device. Use if you suspect account compromise.
            </p>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-2 rounded bg-destructive text-destructive-foreground disabled:opacity-50" disabled={lockMut.isPending} onClick={() => lockMut.mutate()}>
                Activate emergency lock
              </button>
              <button className="text-xs px-3 py-2 rounded border disabled:opacity-50" disabled={unlockMut.isPending} onClick={() => unlockMut.mutate()}>
                Unlock devices
              </button>
            </div>
          </Card>
          <Card title="Unacknowledged security alerts" className="md:col-span-2">
            <ul className="divide-y">
              {(alerts.data ?? []).filter(a => !a.acknowledged_at).map(a => (
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
          </Card>
        </div>
      )}

      {tab === "devices" && (
        <Card title="Trusted devices">
          <ul className="divide-y">
            {(devices.data ?? []).map((d) => (
              <DeviceRow key={d.id} d={d}
                onTrust={(t) => trustMut.mutate({ device_id: d.id, trusted: t })}
                onRevoke={() => revokeMut.mutate({ device_id: d.id })}
                onRename={(name) => renameMut.mutate({ device_id: d.id, device_name: name })} />
            ))}
            {(devices.data ?? []).length === 0 && <li className="py-2 text-sm text-muted-foreground">No devices recorded yet.</li>}
          </ul>
        </Card>
      )}

      {tab === "sessions" && <SessionsPanel sessions={sessions.data ?? []} onLogout={(id) => logoutMut.mutate({ session_id: id })} />}

      {tab === "recovery" && (
        <Card title="Recovery codes">
          <p className="text-sm text-muted-foreground mb-3">
            One-time codes to sign in if you lose access. Store them offline. Generating new codes invalidates any previous set.
          </p>
          <button
            className="text-xs px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
            disabled={codesMut.isPending}
            onClick={() => codesMut.mutate()}
          >
            {codesMut.isPending ? "Generating…" : "Generate 10 recovery codes"}
          </button>
          {recoveryCodes && (
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm rounded border p-3 bg-muted/30">
                {recoveryCodes.map((c) => <div key={c}>{c}</div>)}
              </div>
              <div className="flex gap-2">
                <button className="text-xs px-2 py-1 rounded border" onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join("\n"));
                  ok("Copied to clipboard");
                }}>Copy</button>
                <button className="text-xs px-2 py-1 rounded border" onClick={() => {
                  const blob = new Blob([recoveryCodes.join("\n")], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "happy-recovery-codes.txt"; a.click();
                  URL.revokeObjectURL(url);
                }}>Download</button>
                <button className="text-xs px-2 py-1 rounded border" onClick={() => window.print()}>Print</button>
              </div>
              <p className="text-xs text-muted-foreground">Codes will not be shown again after you leave this page.</p>
            </div>
          )}
        </Card>
      )}

      {tab === "providers" && (
        <Card title="Sign-in providers">
          <p className="text-sm text-muted-foreground mb-3">Providers activate automatically once their credentials are configured. No credentials are hardcoded.</p>
          <ul className="divide-y">
            {(providers.data ?? []).map((p) => (
              <li key={p.provider} className="py-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{p.display_name}</div>
                  <div className="text-xs text-muted-foreground">{p.category}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${p.enabled ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : p.configured ? "bg-amber-500/10 border-amber-500/30 text-amber-600" : "bg-muted"}`}>
                  {p.enabled ? "Enabled" : p.configured ? "Configured" : p.architecture_ready ? "Architecture Ready · Configure to Enable" : "Unavailable"}
                </span>
              </li>
            ))}
            {(providers.data ?? []).length === 0 && <li className="py-2 text-sm text-muted-foreground">Loading providers…</li>}
          </ul>
        </Card>
      )}

      {tab === "history" && (
        <Card title="Login history">
          <ul className="divide-y max-h-[500px] overflow-auto">
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
            {(history.data ?? []).length === 0 && <li className="py-2 text-sm text-muted-foreground">No history recorded yet.</li>}
          </ul>
        </Card>
      )}

      {tab === "privacy" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Session policy (personal override)">
            <PolicyEditor current={policy.data} onSave={(v) => policyMut.mutate(v)} pending={policyMut.isPending} />
          </Card>
          <Card title="Privacy">
            <p className="text-sm text-muted-foreground mb-3">
              Login history and device metadata are stored append-only and visible only to you and the HAPPY security engine.
              Emergency lock revokes all active sessions immediately.
            </p>
            <p className="text-xs text-muted-foreground">
              To request full data export or deletion, contact the HAPPY founder desk from the Support surface.
            </p>
          </Card>
        </div>
      )}
    </Container>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border p-4 ${className}`}>
      <h2 className="font-medium mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function DeviceRow({ d, onTrust, onRevoke, onRename }: {
  d: { id: string; device_name?: string | null; device_fingerprint: string; os?: string | null; browser?: string | null; trusted: boolean; revoked_at?: string | null; last_seen_at: string };
  onTrust: (t: boolean) => void; onRevoke: () => void; onRename: (name: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(d.device_name ?? "");
  return (
    <li className="py-2 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        {renaming ? (
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="text-sm px-2 py-1 rounded border flex-1" />
            <button className="text-xs px-2 py-1 rounded border" onClick={() => { onRename(name); setRenaming(false); }}>Save</button>
            <button className="text-xs px-2 py-1 rounded border" onClick={() => setRenaming(false)}>Cancel</button>
          </div>
        ) : (
          <>
            <div className="text-sm">{d.device_name ?? d.device_fingerprint.slice(0,12)} · {d.os ?? "?"} · {d.browser ?? "?"}</div>
            <div className="text-xs text-muted-foreground">
              {d.trusted ? "Trusted · " : ""}{d.revoked_at ? "Revoked" : `last seen ${new Date(d.last_seen_at).toLocaleString()}`}
            </div>
          </>
        )}
      </div>
      {!d.revoked_at && !renaming && (
        <div className="flex items-center gap-2">
          <button className="text-xs px-2 py-1 rounded border" onClick={() => setRenaming(true)}>Rename</button>
          <button className="text-xs px-2 py-1 rounded border" onClick={() => onTrust(!d.trusted)}>{d.trusted ? "Untrust" : "Trust"}</button>
          <button className="text-xs px-2 py-1 rounded border" onClick={onRevoke}>Revoke</button>
        </div>
      )}
    </li>
  );
}

function SessionsPanel({ sessions, onLogout }: {
  sessions: Array<{ id: string; session_key: string; user_agent?: string | null; last_active_at: string; ended_at?: string | null }>;
  onLogout: (id: string) => void;
}) {
  const [currentKey, setCurrentKey] = useState<string>("");
  // Best-effort current session detection
  if (!currentKey && typeof window !== "undefined") {
    supabase.auth.getSession().then(({ data }) => {
      const k = getSessionKey(data.session?.access_token);
      setCurrentKey(k);
    }).catch(() => {});
  }
  const active = sessions.filter(s => !s.ended_at);
  const current = active.find(s => s.session_key === currentKey);
  const others = active.filter(s => s.session_key !== currentKey);
  return (
    <div className="grid gap-4">
      <Card title="Current session">
        {current ? (
          <div className="text-sm">
            <div>{current.user_agent ?? "This browser"}</div>
            <div className="text-xs text-muted-foreground">last active {new Date(current.last_active_at).toLocaleString()}</div>
          </div>
        ) : <p className="text-sm text-muted-foreground">Current session not yet recorded.</p>}
      </Card>
      <Card title="Other active sessions">
        <ul className="divide-y">
          {others.map((s) => (
            <li key={s.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm truncate">{s.user_agent ?? "Unknown device"}</div>
                <div className="text-xs text-muted-foreground">last active {new Date(s.last_active_at).toLocaleString()}</div>
              </div>
              <button className="text-xs px-2 py-1 rounded border" onClick={() => onLogout(s.id)}>Sign out</button>
            </li>
          ))}
          {others.length === 0 && <li className="py-2 text-sm text-muted-foreground">No other active sessions.</li>}
        </ul>
      </Card>
    </div>
  );
}

function PolicyEditor({ current, onSave, pending }: {
  current: { max_active_sessions?: number | null; require_trusted_device?: boolean | null; idle_timeout_minutes?: number | null; require_mfa?: boolean | null } | undefined;
  onSave: (v: { max_active_sessions?: number; require_trusted_device?: boolean; idle_timeout_minutes?: number; require_mfa?: boolean }) => void;
  pending: boolean;
}) {
  const [max, setMax] = useState(current?.max_active_sessions ?? 1);
  const [trusted, setTrusted] = useState(current?.require_trusted_device ?? false);
  const [idle, setIdle] = useState(current?.idle_timeout_minutes ?? 43200);
  const [mfa, setMfa] = useState(current?.require_mfa ?? false);
  return (
    <form className="space-y-3 text-sm" onSubmit={(e) => { e.preventDefault(); onSave({ max_active_sessions: max, require_trusted_device: trusted, idle_timeout_minutes: idle, require_mfa: mfa }); }}>
      <label className="flex justify-between items-center gap-3">
        <span>Max active sessions</span>
        <input type="number" min={1} max={50} value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-24 px-2 py-1 rounded border" />
      </label>
      <label className="flex justify-between items-center gap-3">
        <span>Require trusted device</span>
        <input type="checkbox" checked={trusted} onChange={(e) => setTrusted(e.target.checked)} />
      </label>
      <label className="flex justify-between items-center gap-3">
        <span>Idle timeout (min)</span>
        <input type="number" min={1} value={idle} onChange={(e) => setIdle(Number(e.target.value))} className="w-28 px-2 py-1 rounded border" />
      </label>
      <label className="flex justify-between items-center gap-3">
        <span>Require MFA</span>
        <input type="checkbox" checked={mfa} onChange={(e) => setMfa(e.target.checked)} />
      </label>
      <button type="submit" disabled={pending} className="text-xs px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50">
        {pending ? "Saving…" : "Save policy"}
      </button>
    </form>
  );
}
