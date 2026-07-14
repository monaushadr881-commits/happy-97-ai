/**
 * V2Module — shared tabbed layout for reserved v2.0 phase surfaces.
 *
 * Provides a consistent header, KPI grid, tab bar and "Reserved" callout
 * for phase modules whose runtime activates in a future cycle.
 */
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { type LucideIcon, Sparkles } from "lucide-react";

export type V2Tab = { to: string; label: string; icon: LucideIcon; exact?: boolean };
export type V2Kpi = { label: string; value: string; hint?: string };

export function V2ModuleShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  tabs,
  overview,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tabs: V2Tab[];
  overview: { kpis: V2Kpi[]; note: string };
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const root = tabs[0]?.to ?? "/";
  const isRoot = pathname === root;

  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="font-display text-3xl lg:text-4xl tracking-tight">{title}</h1>
          </div>
        </div>
        <p className="text-sm text-soft-gray leading-relaxed max-w-2xl">{description}</p>

        <nav className="mt-8 flex flex-wrap gap-2 border-b border-white/5 pb-3">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/");
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "bg-gold/10 text-gold border border-gold/30"
                    : "text-soft-gray hover:text-paper hover:bg-white/5 border border-transparent"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>

        {isRoot ? <V2Overview kpis={overview.kpis} note={overview.note} /> : <Outlet />}
      </div>
    </div>
  );
}

function V2Overview({ kpis, note }: { kpis: V2Kpi[]; note: string }) {
  return (
    <div className="mt-8 space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-white/5 bg-charcoal p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-soft-gray/70">{k.label}</p>
            <p className="mt-2 font-display text-2xl">{k.value}</p>
            {k.hint && <p className="mt-1 text-[11px] text-soft-gray/70">{k.hint}</p>}
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent p-6">
        <p className="eyebrow mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" /> Reserved
        </p>
        <h3 className="font-display text-xl tracking-tight">Runtime activates in a future production cycle.</h3>
        <p className="mt-2 text-sm text-soft-gray max-w-2xl">{note}</p>
      </div>
    </div>
  );
}

/** Simple reserved tab body — headline, description, bullet capabilities. */
export function V2TabBody({
  title,
  description,
  bullets,
  apiHints,
}: {
  title: string;
  description: string;
  bullets: string[];
  apiHints?: string[];
}) {
  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-soft-gray max-w-2xl">{description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {bullets.map((b) => (
          <div key={b} className="rounded-xl border border-white/5 bg-charcoal p-4 text-sm text-paper/90">
            <Sparkles className="h-3.5 w-3.5 text-gold mb-2" />
            {b}
          </div>
        ))}
      </div>
      {apiHints && apiHints.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-charcoal/60 p-4">
          <p className="eyebrow mb-2">Reserved contracts</p>
          <ul className="text-xs text-soft-gray space-y-1">
            {apiHints.map((a) => (
              <li key={a}>
                • <code>{a}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
