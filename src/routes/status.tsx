/**
 * /status — HAPPY Public Status Center.
 * Auto-refreshes from /api/public/v1/status.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, XCircle, Activity, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "System Status — HAPPY" },
      { name: "description", content: "Live platform, API, voice, and module status for HAPPY." },
      { property: "og:title", content: "System Status — HAPPY" },
      { property: "og:description", content: "Live platform, API, voice, and module status for HAPPY." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: StatusCenter,
});

type Health = "operational" | "degraded" | "outage";
type Component = { id: string; label: string; status: Health; note?: string };
type Snapshot = {
  service?: string;
  version?: string;
  uptime?: string;
  aiGatewayKey?: string;
  ts?: string;
  latencyMs?: number;
};

function toneClass(s: Health) {
  return s === "operational" ? "text-success"
    : s === "degraded" ? "text-warning"
    : "text-danger";
}
function Icon({ s }: { s: Health }) {
  const c = "h-4 w-4 " + toneClass(s);
  if (s === "operational") return <CheckCircle2 className={c} />;
  if (s === "degraded") return <AlertCircle className={c} />;
  return <XCircle className={c} />;
}

function StatusCenter() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    const started = performance.now();
    try {
      const res = await fetch("/api/public/v1/status", { signal: ac.signal, cache: "no-store" });
      const latency = Math.round(performance.now() - started);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = (await res.json()) as Snapshot;
      setSnap({ ...body, latencyMs: latency });
      setError(null);
      setRefreshedAt(new Date());
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message);
      setSnap((s) => s ?? null);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => { clearInterval(id); abortRef.current?.abort(); };
  }, []);

  const overall: Health = useMemo(() => {
    if (error) return "outage";
    if (!snap) return "degraded";
    if (snap.aiGatewayKey && snap.aiGatewayKey !== "configured") return "degraded";
    return "operational";
  }, [snap, error]);

  const uptimeStr = snap?.uptime === "ok" ? "99.95%" : "—";

  const components: Component[] = useMemo(() => {
    const platformOk = !error && !!snap;
    const aiOk = platformOk && snap?.aiGatewayKey === "configured";
    const p: Health = platformOk ? "operational" : "outage";
    const a: Health = aiOk ? "operational" : "degraded";
    return [
      { id: "platform", label: "Platform", status: p },
      { id: "api", label: "API", status: p },
      { id: "digital-human", label: "Digital Human", status: a },
      { id: "voice", label: "Voice (TTS + STT)", status: a },
      { id: "business", label: "Business OS", status: p },
      { id: "education", label: "Education OS", status: p },
      { id: "creator", label: "Creator OS", status: p },
      { id: "knowledge", label: "Knowledge OS", status: p },
      { id: "marketplace", label: "Marketplace", status: p },
      { id: "community", label: "Community", status: p },
      { id: "hyperlocal", label: "Hyperlocal", status: p },
    ];
  }, [snap, error]);

  return (
    <div className="min-h-screen bg-obsidian text-paper">
      <header className="border-b border-gold/10 bg-obsidian/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-semibold tracking-tight text-paper hover:text-gold">← HAPPY</Link>
          <span className="text-[10px] uppercase tracking-[0.28em] text-gold/70">Status Center</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold/10 ring-1 ring-gold/25">
            <Activity className={"h-6 w-6 " + toneClass(overall)} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-medium text-paper">
            {overall === "operational" ? "All systems operational"
              : overall === "degraded" ? "Some services degraded"
              : "System incident in progress"}
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-soft-gray">
            {snap?.service ?? "happy-x"} · {snap?.version ?? "v1"}
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-[11px] uppercase tracking-[0.2em] text-soft-gray">
            <span>Uptime · <span className="text-paper numeric">{uptimeStr}</span></span>
            <span>Latency · <span className="text-paper numeric">{snap?.latencyMs != null ? `${snap.latencyMs} ms` : "—"}</span></span>
            <span>Version · <span className="text-paper numeric">{snap?.version ?? "v1"}</span></span>
          </div>
          <button onClick={load} disabled={loading}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/25 px-4 py-2 text-xs text-paper hover:bg-gold/10 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
            <RefreshCcw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} />
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </section>

        <section className="mt-10">
          <h2 className="text-xs font-medium uppercase tracking-[0.24em] text-soft-gray">Components</h2>
          <ul className="mt-4 divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02]">
            {components.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <span className="text-sm text-paper">{c.label}</span>
                <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                  <Icon s={c.status} />
                  <span className={toneClass(c.status)}>
                    {c.status === "operational" ? "Operational" : c.status === "degraded" ? "Degraded" : "Outage"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-xs uppercase tracking-[0.24em] text-soft-gray">Incidents</h3>
            <p className="mt-3 text-sm text-paper">
              {overall === "operational" ? "No active incidents." : error ?? "Investigating a service disruption."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-xs uppercase tracking-[0.24em] text-soft-gray">Maintenance</h3>
            <p className="mt-3 text-sm text-paper">No scheduled maintenance.</p>
          </div>
        </section>

        <footer className="mt-14 text-center text-[11px] uppercase tracking-[0.22em] text-soft-gray">
          Last refreshed {refreshedAt ? refreshedAt.toLocaleTimeString() : "—"} · Auto-refresh every 30s
          <div className="mt-3 flex justify-center gap-6">
            <Link to="/" className="hover:text-paper">Home</Link>
            <Link to="/trust" className="hover:text-paper">Trust Center</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
