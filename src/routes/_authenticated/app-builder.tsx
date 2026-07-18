/**
 * /app-builder — App Builder (R141).
 * Tabbed UI over canonical app-builder + AppBuilderV1.
 * Screens · Navigation · Components · Theme · Preview · Publish.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import { AppBuilderV1List, AppBuilderV1Analytics } from "@/lib/app-builder-v1.functions";
import { listApps } from "@/lib/app-builder/app-builder.functions";
import { Smartphone, Menu, Component, Palette, Eye, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app-builder")({
  head: () => ({ meta: [{ title: "App Builder — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: AppBuilder,
});

const TABS = [
  { slug: "screens",     label: "Screens",     icon: Smartphone },
  { slug: "navigation",  label: "Navigation",  icon: Menu },
  { slug: "components",  label: "Components",  icon: Component },
  { slug: "theme",       label: "Theme",       icon: Palette },
  { slug: "preview",     label: "Preview",     icon: Eye },
  { slug: "publish",     label: "Publish",     icon: Rocket },
];

type App = { id: string; name?: string | null; status?: string | null };

function AppBuilder() {
  const active = useActiveTab(TABS);
  const list = useQuery({ queryKey: ["app","list"], queryFn: () => listApps({ data: {} }) });
  const v1 = useQuery({ queryKey: ["app","v1"], queryFn: () => AppBuilderV1List() });
  const analytics = useQuery({ queryKey: ["app","an"], queryFn: () => AppBuilderV1Analytics() });
  const apps = (list.data ?? v1.data ?? []) as unknown as App[];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader eyebrow="App Builder · R141" title="Apps"
        description="Design, preview and publish native-quality apps — canonical app-builder engine, no duplicate runtime." />
      <TabBar tabs={TABS} />

      {active === "screens" && (
        <Panel className="p-5 mt-4">
          <div className="flex items-center justify-between mb-3"><div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Apps & screens</div><Chip tone="gold">{apps.length}</Chip></div>
          <Hairline className="mb-3" />
          <ul className="divide-y divide-white/5 text-xs">
            {apps.slice(0, 30).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2">
                <span className="text-paper truncate">{a.name ?? a.id}</span>
                {a.status && <Chip tone="gold">{a.status}</Chip>}
              </li>
            ))}
            {apps.length === 0 && <li className="py-3 text-soft-gray">No apps yet. Ask HAPPY to generate one from a brief.</li>}
          </ul>
        </Panel>
      )}

      {active === "navigation" && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Tab bar, drawer, stack navigation.</div></Panel>}
      {active === "components" && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Shared with Website Builder — one canonical component library.</div></Panel>}
      {active === "theme"      && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Colour tokens, typography, radius, dark mode.</div></Panel>}
      {active === "preview"    && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">iOS / Android device preview.</div></Panel>}
      {active === "publish"    && (
        <Panel className="p-5 mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Publish</div>
          <Hairline className="mb-3" />
          <div className="text-xs text-soft-gray">PWA immediately. Native app store publish blocked on external Apple / Google credentials (R101). Analytics: {JSON.stringify(analytics.data ?? {}).slice(0,120)}</div>
        </Panel>
      )}
    </div>
  );
}
