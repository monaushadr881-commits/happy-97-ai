/**
 * /websites — Website Builder (R141).
 * Tabbed UI over canonical website-builder-v1 + WebsiteBuilderV1 status.
 * Pages · Sections · Components · Theme · Navigation · SEO · Forms · Preview · Publish.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import { WebsiteBuilderV1List, WebsiteBuilderV1Analytics } from "@/lib/website-builder-v1.functions";
import { listWebsiteProjects } from "@/lib/website-builder/builder.functions";
import { Layout, Layers, Component, Palette, Menu, Search, FormInput, Eye, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/websites")({
  head: () => ({ meta: [{ title: "Website Builder — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: Websites,
});

const TABS = [
  { slug: "pages",      label: "Pages",       icon: Layout },
  { slug: "sections",   label: "Sections",    icon: Layers },
  { slug: "components", label: "Components",  icon: Component },
  { slug: "theme",      label: "Theme",       icon: Palette },
  { slug: "navigation", label: "Navigation",  icon: Menu },
  { slug: "seo",        label: "SEO",         icon: Search },
  { slug: "forms",      label: "Forms",       icon: FormInput },
  { slug: "preview",    label: "Preview",     icon: Eye },
  { slug: "publish",    label: "Publish",     icon: Rocket },
];

type WSite = { id: string; name?: string | null; status?: string | null; slug?: string | null };

function Websites() {
  const active = useActiveTab(TABS);
  const list = useQuery({ queryKey: ["ws","list"], queryFn: () => listWebsiteProjects() });
  const v1 = useQuery({ queryKey: ["ws","v1"], queryFn: () => WebsiteBuilderV1List() });
  const analytics = useQuery({ queryKey: ["ws","an"], queryFn: () => WebsiteBuilderV1Analytics() });
  const sites = (list.data ?? v1.data ?? []) as unknown as WSite[];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <PageHeader eyebrow="Website Builder · R141" title="Websites"
        description="AI-native site builder — pages, sections, theme, SEO, forms and publishing on the canonical website-builder runtime." />
      <TabBar tabs={TABS} />

      {active === "pages" && (
        <Panel className="p-5 mt-4">
          <div className="flex items-center justify-between mb-3"><div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Projects & pages</div><Chip tone="gold">{sites.length}</Chip></div>
          <Hairline className="mb-3" />
          <ul className="divide-y divide-white/5 text-xs">
            {sites.slice(0, 30).map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2">
                <span className="text-paper truncate">{s.name ?? s.slug ?? s.id}</span>
                {s.status && <Chip tone="gold">{s.status}</Chip>}
              </li>
            ))}
            {sites.length === 0 && <li className="py-3 text-soft-gray">No websites yet. Ask HAPPY to generate one.</li>}
          </ul>
        </Panel>
      )}

      {active === "sections"   && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Reusable sections library — hero, features, pricing, testimonials, CTA, footer. Managed by canonical website-builder engine.</div></Panel>}
      {active === "components" && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Component library shared with App Builder. Same canonical component owner.</div></Panel>}
      {active === "theme"      && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Palette, typography, radius, shadow tokens. Applies to every page in the project.</div></Panel>}
      {active === "navigation" && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Header/footer/mobile navigation editor.</div></Panel>}
      {active === "seo"        && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Per-page title, description, og:image, sitemap, robots, structured data.</div></Panel>}
      {active === "forms"      && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Lead/contact/newsletter forms. Submissions land in canonical CRM (R122).</div></Panel>}
      {active === "preview"    && <Panel className="p-5 mt-4"><div className="text-xs text-soft-gray">Device-preview iframe (mobile/tablet/desktop). Live from canonical renderer.</div></Panel>}
      {active === "publish"    && (
        <Panel className="p-5 mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Publish targets</div>
          <Hairline className="mb-3" />
          <div className="text-xs text-soft-gray">Custom domain, SSL, CDN. Analytics: {JSON.stringify(analytics.data ?? {}).slice(0,120)}</div>
        </Panel>
      )}
    </div>
  );
}
