import type { LucideIcon } from "lucide-react";

export type PersonaTile = { icon: LucideIcon; label: string; desc: string };

export function PersonaDashboard({
  persona,
  subtitle,
  tiles,
}: {
  persona: string;
  subtitle: string;
  tiles: PersonaTile[];
}) {
  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-obsidian/60 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
            {persona} Workspace
          </div>
          <h1 className="mt-3 text-2xl md:text-3xl font-black tracking-tight">{persona} Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-soft-gray">{subtitle}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tiles.map((t) => (
          <button
            key={t.label}
            type="button"
            className="group relative overflow-hidden rounded-2xl border border-gold/20 bg-obsidian/60 p-5 text-left backdrop-blur transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_20px_60px_-15px_rgba(212,175,55,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
          >
            <t.icon className="h-5 w-5 text-gold" />
            <div className="mt-3 text-sm font-semibold text-paper">{t.label}</div>
            <div className="mt-1 text-xs text-soft-gray">{t.desc}</div>
            <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
