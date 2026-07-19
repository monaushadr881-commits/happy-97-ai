/**
 * R157 — Founder Security Center.
 * Renders the 10 Security-Center panels backed exclusively by HAPPY ID
 * canonical server fns. NO new runtime, NO new auth stack.
 */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Panel, StatCard, Chip, Hairline } from "@/design-system/primitives";
import {
  listMyDevices, listMySessions, listMyLoginHistory, listMySecurityAlerts,
  generateRecoveryCodes, emergencyLock, emergencyUnlock,
  renameDevice, revokeDevice, trustDevice, remoteLogoutAllOthers,
  listMyPasskeys, revokePasskey, renamePasskey, markPasskeyAsBackup,
  computeRiskScore,
} from "@/lib/happy-id.functions";
import {
  securityScore, fortressSnapshot, riskAction,
  hasSufficientRecovery, isVerifiedFounder,
} from "@/lib/founder/identity-fortress";
import {
  passkeyStatus, nextPasskeyStep, passkeysSupported,
  type PasskeyRow,
} from "@/lib/happy-id/passkeys";
import {
  ShieldCheck, ShieldAlert, KeyRound, Fingerprint, Lock, Unlock,
  Smartphone, RefreshCcw, AlertTriangle, MapPin, Trash2, Edit3, Star,
} from "lucide-react";

interface Props { isFounder: boolean }

type DeviceRow = Awaited<ReturnType<typeof listMyDevices>>[number];
type SessionRow = Awaited<ReturnType<typeof listMySessions>>[number];
type LoginRow = Awaited<ReturnType<typeof listMyLoginHistory>>[number];
type AlertRow = Awaited<ReturnType<typeof listMySecurityAlerts>>[number];

export function FounderSecurityCenter({ isFounder }: Props) {
  const qc = useQueryClient();
  const snapshot = useMemo(() => fortressSnapshot({ isFounder }), [isFounder]);
  const verified = isVerifiedFounder({ isFounder });

  const devices = useQuery({ queryKey: ["fsc","devices"], queryFn: () => listMyDevices() });
  const sessions = useQuery({ queryKey: ["fsc","sessions"], queryFn: () => listMySessions() });
  const history = useQuery({ queryKey: ["fsc","history"], queryFn: () => listMyLoginHistory() });
  const alerts = useQuery({ queryKey: ["fsc","alerts"], queryFn: () => listMySecurityAlerts() });
  const passkeys = useQuery({ queryKey: ["fsc","passkeys"], queryFn: () => listMyPasskeys() });

  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [locked, setLocked] = useState(false);

  const rotate = useMutation({
    mutationFn: () => generateRecoveryCodes(),
    onSuccess: (r) => setNewCodes(r.codes ?? []),
  });
  const lock = useMutation({
    mutationFn: () => emergencyLock(),
    onSuccess: () => { setLocked(true); qc.invalidateQueries({ queryKey: ["fsc"] }); },
  });
  const unlock = useMutation({
    mutationFn: () => emergencyUnlock(),
    onSuccess: () => { setLocked(false); qc.invalidateQueries({ queryKey: ["fsc"] }); },
  });
  const logoutOthers = useMutation({
    mutationFn: () => remoteLogoutAllOthers(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fsc","sessions"] }),
  });
  const revokeDev = useMutation({
    mutationFn: (id: string) => revokeDevice({ data: { device_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fsc","devices"] }),
  });
  const trustDev = useMutation({
    mutationFn: (id: string) => trustDevice({ data: { device_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fsc","devices"] }),
  });
  const renameDev = useMutation({
    mutationFn: (v: { id: string; name: string }) => renameDevice({ data: { device_id: v.id, device_name: v.name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fsc","devices"] }),
  });
  const revokePk = useMutation({
    mutationFn: (id: string) => revokePasskey({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fsc","passkeys"] }),
  });
  const renamePk = useMutation({
    mutationFn: (v: { id: string; label: string }) => renamePasskey({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fsc","passkeys"] }),
  });
  const backupPk = useMutation({
    mutationFn: (v: { id: string; is_backup: boolean }) => markPasskeyAsBackup({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fsc","passkeys"] }),
  });

  const deviceRows = (devices.data ?? []) as DeviceRow[];
  const sessionRows = ((sessions.data ?? []) as SessionRow[]).filter((s) => !(s as { ended_at?: string | null }).ended_at);
  const historyRows = (history.data ?? []) as LoginRow[];
  const alertRows = ((alerts.data ?? []) as AlertRow[]).filter((a) => !(a as { acknowledged_at?: string | null }).acknowledged_at);
  const pkRows = (passkeys.data ?? []) as PasskeyRow[];

  const failed24h = historyRows.filter((h) => !(h as { success?: boolean }).success && new Date((h as { created_at: string }).created_at).getTime() > Date.now() - 24*60*60*1000).length;
  const trustedCount = deviceRows.filter((d) => (d as { trusted?: boolean }).trusted && !(d as { revoked_at?: string | null }).revoked_at).length;
  const pkStat = passkeyStatus(pkRows);
  const pkStep = nextPasskeyStep(pkRows, passkeysSupported());

  const posture = securityScore({
    recovery: {
      emailPrimaryVerified: true, emailSecondaryVerified: false,
      phonePrimaryVerified: false, phoneSecondaryVerified: false,
      recoveryCodesRemaining: newCodes?.length ?? 10, trustedDevicesCount: trustedCount,
    },
    mfa: {
      emailOtp: true, smsOtp: false,
      authenticator: false, passkey: pkStat.count > 0,
    },
    activeSessions: sessionRows.length,
    failedLoginsLast24h: failed24h,
    passwordAgeDays: 30,
  });
  const risk = computeRiskScore({
    failedLoginsLast24h: failed24h, deviceTrusted: trustedCount > 0,
    newDevice: deviceRows.some((d) => !(d as { trusted?: boolean }).trusted),
  });
  const action = riskAction(risk.score);
  const recoveryOk = hasSufficientRecovery({
    emailPrimaryVerified: true, emailSecondaryVerified: false,
    phonePrimaryVerified: false, phoneSecondaryVerified: false,
    recoveryCodesRemaining: 10, trustedDevicesCount: trustedCount,
  });

  return (
    <>
      {/* Identity Status */}
      <Panel className="mt-6 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-soft-gray">Identity Status</div>
            <div className="mt-1 text-lg text-paper">
              {verified ? "Verified Platform Founder" : "Standard account"}
            </div>
            <div className="text-[11px] text-soft-gray">
              Role changes from UI are permanently disabled. Recovery only via Happy ID.
            </div>
          </div>
          <Chip tone={verified ? "success" : "neutral"}>{verified ? "FORTIFIED" : "STANDARD"}</Chip>
        </div>
      </Panel>

      {/* Overview stats */}
      <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Security Score" value={`${posture.score}`} icon={<ShieldCheck className="h-4 w-4" />} trend={posture.level === "critical" ? "down" : posture.level === "excellent" ? "up" : "flat"} />
        <StatCard label="Risk Score" value={`${risk.score}`} icon={<ShieldAlert className="h-4 w-4" />} trend={action === "allow" ? "flat" : "down"} />
        <StatCard label="Active Sessions" value={sessionRows.length.toLocaleString()} icon={<Smartphone className="h-4 w-4" />} />
        <StatCard label="Trusted Devices" value={trustedCount.toLocaleString()} icon={<Fingerprint className="h-4 w-4" />} />
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Passkeys */}
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Passkeys (WebAuthn)</h3>
            <Chip tone={pkStat.meetsFounderPolicy ? "success" : pkStat.count > 0 ? "warning" : "danger"}>
              {pkStep === "complete" ? "COMPLETE" : pkStep === "register_backup" ? "ADD BACKUP" : pkStep === "register_primary" ? "REGISTER" : "UNSUPPORTED"}
            </Chip>
          </div>
          <div className="mt-1 text-[11px] text-soft-gray">
            {pkStat.count} active · backup: {pkStat.backup ? "yes" : "no"} · Windows Hello / Touch ID / Face ID / Security Keys.
          </div>
          <Hairline className="my-3" />
          <ul className="divide-y divide-white/5">
            {pkRows.filter((r) => !r.revoked_at).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{r.label} {r.is_backup && <Chip tone="info">BACKUP</Chip>}</div>
                  <div className="text-[11px] text-soft-gray">{r.authenticator_type} · added {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button title="Rename" className="rounded p-1 text-soft-gray hover:bg-white/5 hover:text-paper"
                    onClick={() => { const lbl = window.prompt("New label", r.label); if (lbl) renamePk.mutate({ id: r.id, label: lbl }); }}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button title={r.is_backup ? "Unmark backup" : "Mark as backup"} className="rounded p-1 text-soft-gray hover:bg-white/5 hover:text-paper"
                    onClick={() => backupPk.mutate({ id: r.id, is_backup: !r.is_backup })}>
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button title="Remove" className="rounded p-1 text-soft-gray hover:bg-white/5 hover:text-danger"
                    onClick={() => { if (confirm(`Remove passkey "${r.label}"?`)) revokePk.mutate(r.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {!pkRows.filter((r) => !r.revoked_at).length && (
              <li className="py-2 text-xs text-soft-gray">
                No passkeys enrolled. WebAuthn is {passkeysSupported() ? "supported" : "unsupported"} on this device.
              </li>
            )}
          </ul>
        </Panel>

        {/* Recovery Codes */}
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recovery Codes</h3>
            <Chip tone={recoveryOk ? "success" : "warning"}>{recoveryOk ? "SUFFICIENT" : "SETUP RECOMMENDED"}</Chip>
          </div>
          <div className="mt-1 text-[11px] text-soft-gray">
            Store these one-time codes offline. Each grants a single sign-in when other factors fail.
          </div>
          <Hairline className="my-3" />
          <button className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-paper hover:bg-white/10"
            onClick={() => rotate.mutate()} disabled={rotate.isPending}>
            <RefreshCcw className="mr-1 inline h-3 w-3" /> {rotate.isPending ? "Generating…" : "Generate new codes"}
          </button>
          {newCodes && (
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-md border border-white/10 bg-black/30 p-3 font-mono text-xs text-paper">
              {newCodes.map((c) => <span key={c}>{c}</span>)}
            </div>
          )}
        </Panel>

        {/* Active Sessions */}
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Active Sessions</h3>
            <button className="text-[11px] text-soft-gray underline hover:text-paper" onClick={() => logoutOthers.mutate()}>
              Sign out others
            </button>
          </div>
          <Hairline className="my-3" />
          <ul className="divide-y divide-white/5">
            {sessionRows.map((s) => (
              <li key={(s as { id: string }).id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{(s as { user_agent?: string }).user_agent ?? "Unknown client"}</div>
                  <div className="text-[11px] text-soft-gray">
                    Active {new Date((s as { last_active_at: string }).last_active_at).toLocaleString()}
                  </div>
                </div>
                <Chip tone="success">LIVE</Chip>
              </li>
            ))}
            {!sessionRows.length && <li className="py-2 text-xs text-soft-gray">No active sessions.</li>}
          </ul>
        </Panel>

        {/* Trusted Devices */}
        <Panel className="p-5">
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Trusted Devices</h3>
          <Hairline className="my-3" />
          <ul className="divide-y divide-white/5">
            {deviceRows.filter((d) => !(d as { revoked_at?: string | null }).revoked_at).map((d) => {
              const dev = d as { id: string; device_name?: string | null; os?: string | null; browser?: string | null; trusted?: boolean; location_country?: string | null };
              return (
                <li key={dev.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-paper">{dev.device_name ?? `${dev.browser ?? "Browser"} · ${dev.os ?? "OS"}`}</div>
                    <div className="text-[11px] text-soft-gray flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {dev.location_country ?? "unknown"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {dev.trusted ? <Chip tone="success">TRUSTED</Chip> : <Chip tone="neutral">NEW</Chip>}
                    {!dev.trusted && (
                      <button title="Trust" className="rounded p-1 text-soft-gray hover:bg-white/5 hover:text-paper"
                        onClick={() => trustDev.mutate(dev.id)}><ShieldCheck className="h-3.5 w-3.5" /></button>
                    )}
                    <button title="Rename" className="rounded p-1 text-soft-gray hover:bg-white/5 hover:text-paper"
                      onClick={() => { const n = window.prompt("Device name", dev.device_name ?? ""); if (n) renameDev.mutate({ id: dev.id, name: n }); }}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button title="Revoke" className="rounded p-1 text-soft-gray hover:bg-white/5 hover:text-danger"
                      onClick={() => { if (confirm("Revoke device?")) revokeDev.mutate(dev.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
            {!deviceRows.length && <li className="py-2 text-xs text-soft-gray">No devices registered.</li>}
          </ul>
        </Panel>

        {/* Security Alerts */}
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Security Alerts</h3>
            <Chip tone={alertRows.length ? "warning" : "success"}>{alertRows.length} OPEN</Chip>
          </div>
          <Hairline className="my-3" />
          <ul className="divide-y divide-white/5">
            {alertRows.slice(0, 6).map((a) => {
              const al = a as { id: string; alert_type?: string; message?: string; severity?: string; created_at?: string };
              return (
                <li key={al.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-paper">{al.alert_type}</div>
                    <div className="text-[11px] text-soft-gray truncate">{al.message}</div>
                  </div>
                  <Chip tone={al.severity === "critical" ? "danger" : al.severity === "warning" ? "warning" : "info"}>
                    {al.severity ?? "info"}
                  </Chip>
                </li>
              );
            })}
            {!alertRows.length && <li className="py-2 text-xs text-soft-gray">No open alerts.</li>}
          </ul>
        </Panel>

        {/* OTP Status */}
        <Panel className="p-5">
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">OTP &amp; MFA Factors</h3>
          <Hairline className="my-3" />
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between"><span className="text-paper">Email OTP</span><Chip tone="success">READY</Chip></li>
            <li className="flex items-center justify-between"><span className="text-paper">SMS OTP</span><Chip tone="neutral">EXTERNAL</Chip></li>
            <li className="flex items-center justify-between"><span className="text-paper">Authenticator (TOTP)</span><Chip tone="neutral">SUPPORTED</Chip></li>
            <li className="flex items-center justify-between"><span className="text-paper">Passkey / WebAuthn</span>
              <Chip tone={pkStat.count > 0 ? "success" : "warning"}>{pkStat.count > 0 ? "ENROLLED" : "NOT SET"}</Chip>
            </li>
          </ul>
        </Panel>
      </section>

      {/* Emergency Lock */}
      <Panel className="mt-6 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-soft-gray">Emergency Mode</div>
            <div className="mt-1 text-paper">Revoke every device &amp; end every session immediately.</div>
            <div className="text-[11px] text-soft-gray">Recommended when a device is lost, sessions are hijacked, or the risk score enters lockdown.</div>
          </div>
          <div className="flex items-center gap-2">
            <Chip tone={action === "lockdown" ? "danger" : action === "terminate_sessions" ? "warning" : "info"}>{action}</Chip>
            {locked ? (
              <button className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-paper hover:bg-white/10"
                onClick={() => unlock.mutate()} disabled={unlock.isPending}>
                <Unlock className="h-3.5 w-3.5" /> Unlock
              </button>
            ) : (
              <button className="inline-flex items-center gap-1 rounded-md border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs text-danger hover:bg-danger/20"
                onClick={() => { if (confirm("Lock all devices and end all sessions?")) lock.mutate(); }} disabled={lock.isPending}>
                <Lock className="h-3.5 w-3.5" /> Emergency Lock
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* Security Timeline (login history) */}
      <Panel className="mt-6 p-5">
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> Security Timeline
        </h3>
        <Hairline className="my-3" />
        <ul className="divide-y divide-white/5">
          {historyRows.map((h) => {
            const ev = h as { id: string; event_type: string; provider?: string | null; success: boolean; created_at: string };
            return (
              <li key={ev.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">
                    <span className="text-gold">{ev.event_type}</span>
                    {ev.provider ? <span className="text-soft-gray"> · {ev.provider}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Chip tone={ev.success ? "success" : "danger"}>{ev.success ? "ok" : "fail"}</Chip>
                  <time className="numeric text-[11px] text-soft-gray">{new Date(ev.created_at).toLocaleString()}</time>
                </div>
              </li>
            );
          })}
          {!historyRows.length && (
            <li className="py-2 text-xs text-soft-gray flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" /> No login events yet.
            </li>
          )}
        </ul>
        <div className="mt-3 text-[11px] text-soft-gray">
          Login pipeline: {snapshot.loginPipeline.join(" → ")}
        </div>
      </Panel>
    </>
  );
}
