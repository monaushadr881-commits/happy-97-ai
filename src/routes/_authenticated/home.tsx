/**
 * /workspace/home — HAPPY OS unified workspace home (R21).
 * Pinned apps · Recents · Favorites · Universal launcher · Activity glimpse.
 * Pure UX layer — reads from WorkspaceProvider; no business queries here.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Container } from "@/design-system/primitives";
import { useWorkspace, workspaceForRoute, WORKSPACES } from "@/workspace";
import { Star, Clock, Sparkles, Rocket, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Workspace — HAPPY OS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceHome,
});

function WorkspaceHome() {
  const { recents, favorites, toggleFavorite, isFavorite, activeBusiness } = useWorkspace();

  const recentWs = recents
    .map((r) => ({ route: r, ws: workspaceForRoute(r) }))
    .filter((x) => x.ws)
    .slice(0, 6);

  const favWs = favorites
    .map((r) => ({ route: r, ws: workspaceForRoute(r) }))
    .filter((x) => x.ws);

  return (
    <Container className="py-6 md:py-10 space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-gold/80">HAPPY OS · Workspace</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-medium text-paper truncate">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-soft-gray">
            One login. One AI. One workspace across{" "}
            <span className="text-paper">{activeBusiness.name}</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" className="rounded-full bg-gold text-obsidian hover:bg-gold/90">
            <Link to="/assistant"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ask HAPPY</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full border-gold/30">
            <Link to="/business"><Rocket className="mr-1.5 h-3.5 w-3.5" /> Build</Link>
          </Button>
        </div>
      </header>

      {/* Favorites */}
      <section aria-labelledby="fav-h" className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-gold" />
          <h2 id="fav-h" className="text-xs uppercase tracking-[0.22em] text-soft-gray/80">
            Favorites
          </h2>
        </div>
        {favWs.length === 0 ? (
          <p className="text-xs text-soft-gray">
            Star any workspace to pin it here.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {favWs.map(({ route, ws }) => (
              <WorkspaceCard
                key={route}
                route={route}
                label={ws!.label}
                tagline={ws!.tagline}
                Icon={ws!.icon}
                accent={ws!.accent}
                favorite
                onToggleFav={() => toggleFavorite(route)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recents */}
      {recentWs.length > 0 && (
        <section aria-labelledby="rec-h" className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-gold" />
            <h2 id="rec-h" className="text-xs uppercase tracking-[0.22em] text-soft-gray/80">
              Recent
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {recentWs.map(({ route, ws }) => (
              <WorkspaceCard
                key={route + "-r"}
                route={route}
                label={ws!.label}
                tagline={ws!.tagline}
                Icon={ws!.icon}
                accent={ws!.accent}
                favorite={isFavorite(route)}
                onToggleFav={() => toggleFavorite(route)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Universal launcher */}
      <section aria-labelledby="all-h" className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-3.5 w-3.5 text-gold" />
          <h2 id="all-h" className="text-xs uppercase tracking-[0.22em] text-soft-gray/80">
            All workspaces
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {WORKSPACES.map((w) => (
            <WorkspaceCard
              key={w.id}
              route={w.route}
              label={w.label}
              tagline={w.tagline}
              Icon={w.icon}
              accent={w.accent}
              favorite={isFavorite(w.route)}
              onToggleFav={() => toggleFavorite(w.route)}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}

function WorkspaceCard({
  route,
  label,
  tagline,
  Icon,
  accent,
  favorite,
  onToggleFav,
}: {
  route: string;
  label: string;
  tagline: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  favorite: boolean;
  onToggleFav: () => void;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${accent} p-4 transition-all hover:border-gold/40 hover:shadow-lifted`}
    >
      <button
        onClick={onToggleFav}
        aria-label={favorite ? `Unfavorite ${label}` : `Favorite ${label}`}
        className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full text-soft-gray hover:text-gold hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
      >
        <Star className={`h-3.5 w-3.5 ${favorite ? "fill-gold text-gold" : ""}`} />
      </button>
      <Link to={route} className="block focus-visible:outline-none">
        <div className="h-10 w-10 rounded-xl bg-obsidian/60 border border-white/10 grid place-items-center mb-3">
          <Icon className="h-4 w-4 text-gold" />
        </div>
        <p className="text-sm font-semibold text-paper truncate">{label}</p>
        <p className="text-[11px] text-soft-gray truncate">{tagline}</p>
      </Link>
    </div>
  );
}
