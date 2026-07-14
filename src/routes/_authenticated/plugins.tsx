/** /plugins — Phase 2.5 Plugin Ecosystem overview. */
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Puzzle, Store, Package, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/plugins")({
  head: () => ({
    meta: [
      { title: "Plugins — HAPPY v2.0" },
      { name: "description", content: "Discover, install, and manage HAPPY plugins across your workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PluginsLayout,
});

const tabs = [
  { to: "/plugins", label: "Overview", icon: Puzzle, exact: true },
  { to: "/plugins/store", label: "Store", icon: Store },
  { to: "/plugins/installed", label: "Installed", icon: Package },
  { to: "/plugins/settings", label: "Settings", icon: SettingsIcon },
] as const;

function PluginsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/plugins";

  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
            <Puzzle className="h-6 w-6" />
          </div>
          <div>
            <p className="eyebrow">Roadmap · v2.0 · Phase 2.5</p>
            <h1 className="font-display text-3xl lg:text-4xl tracking-tight">Plugin Ecosystem</h1>
          </div>
        </div>
        <p className="text-sm text-soft-gray leading-relaxed max-w-2xl">
          Extend HAPPY with first-party and partner plugins. Contracts are wired against the
          reserved <code>plugin-v2</code> API — the runtime activates as the plugin sandbox ships.
        </p>

        <nav className="mt-8 flex flex-wrap gap-2 border-b border-white/5 pb-3">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/");
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  active ? "bg-gold/10 text-gold border border-gold/30" : "text-soft-gray hover:text-paper hover:bg-white/5 border border-transparent"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>

        {isIndex ? <PluginsOverview /> : <Outlet />}
      </div>
    </div>
  );
}

function PluginsOverview() {
  const kpis = [
    { label: "Registered plugins", value: "—", hint: "Reserved via plugin-v2 API" },
    { label: "Installed in workspace", value: "0", hint: "Sandbox pending" },
    { label: "Updates available", value: "0", hint: "Checked on demand" },
    { label: "Permissions granted", value: "0", hint: "Scoped via RBAC" },
  ];
  return (
    <div className="mt-8 space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-white/5 bg-charcoal p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-soft-gray/70">{k.label}</p>
            <p className="mt-2 font-display text-2xl">{k.value}</p>
            <p className="mt-1 text-[11px] text-soft-gray/70">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent p-6">
        <p className="eyebrow mb-2">Phase 2.5 · Reserved</p>
        <h3 className="font-display text-xl tracking-tight">Plugin runtime activates in the next production cycle.</h3>
        <p className="mt-2 text-sm text-soft-gray max-w-2xl">
          Registry, marketplace, loader, permissions, analytics, store and settings surfaces are
          reserved. HAPPY remains the single Digital Human — every plugin extends her capabilities,
          never her identity.
        </p>
      </div>
    </div>
  );
}
