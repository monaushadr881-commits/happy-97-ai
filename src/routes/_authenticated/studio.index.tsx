/** /studio — Creator OS dashboard. */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { creatorDashboard } from "@/lib/creator-v1.functions";
import {
  ImageIcon, Mic, Presentation, PenLine, Megaphone, Palette, Images, FolderKanban,
  Sparkles, Activity,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/studio/")({
  head: () => ({ meta: [{ title: "Creator OS — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: CreatorDashboard,
});

const STUDIOS = [
  { to: "/studio/image", label: "Image Studio", icon: ImageIcon, desc: "Generate, edit, iterate visuals." },
  { to: "/studio/voice", label: "Voice Studio", icon: Mic, desc: "Text-to-speech, narration, voice-over." },
  { to: "/studio/presentation", label: "Presentation", icon: Presentation, desc: "AI-authored slide decks." },
  { to: "/studio/copy", label: "Copy Studio", icon: PenLine, desc: "Ads, emails, blogs, product copy." },
  { to: "/studio/marketing", label: "Marketing", icon: Megaphone, desc: "Campaigns and social assets." },
  { to: "/studio/brand", label: "Brand Studio", icon: Palette, desc: "Brand kits, tone, typography." },
  { to: "/studio/assets", label: "Media Library", icon: Images, desc: "All generated media in one place." },
  { to: "/studio/projects", label: "Projects", icon: FolderKanban, desc: "Organize creative work." },
];

function CreatorDashboard() {
  const dash = useQuery({ queryKey: ["creator", "dashboard"], queryFn: () => creatorDashboard() });
  const d = dash.data;
  return (
    <>
      <PageHeader
        eyebrow="Creator OS"
        title="AI Creator Platform"
        description="One unified studio for every kind of creative work — image, video, voice, music, presentation, brand and marketing. All powered by HAPPY through the Lovable AI Gateway."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Panel className="p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">Projects</div>
          <div className="text-3xl font-serif text-paper mt-2">{d?.total_projects ?? "—"}</div>
        </Panel>
        <Panel className="p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">Media assets</div>
          <div className="text-3xl font-serif text-paper mt-2">{d?.total_assets ?? "—"}</div>
        </Panel>
        <Panel className="p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">Generations</div>
          <div className="text-3xl font-serif text-paper mt-2">{d?.total_generations ?? "—"}</div>
        </Panel>
      </div>

      <Panel className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-gold" />
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Studios</div>
        </div>
        <Hairline className="mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STUDIOS.map((s) => (
            <Link key={s.to} to={s.to}
              className="group rounded-md border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-gold/30 hover:bg-gold/[0.03]"
            >
              <s.icon className="h-5 w-5 text-gold mb-3" />
              <div className="text-sm text-paper font-medium">{s.label}</div>
              <div className="text-[11px] text-soft-gray mt-1">{s.desc}</div>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-gold" />
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Recent activity</div>
        </div>
        <Hairline className="mb-4" />
        {(!d?.recent || d.recent.length === 0) ? (
          <div className="text-xs text-soft-gray">No generations yet. Pick a studio above to start.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {d.recent.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2">
                <Chip tone="gold">{r.studio}</Chip>
                <span className="text-xs text-soft-gray">{r.operation}</span>
                <span className="text-[11px] text-soft-gray truncate ml-auto">{r.model}</span>
                <span className="text-[10px] text-soft-gray/60">{new Date(r.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
