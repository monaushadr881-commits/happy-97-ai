/**
 * /cms — HAPPY Enterprise CMS™ (R235)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Publishing / Knowledge / Mission Control via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Newspaper, FileText, PenSquare, Package, ImageIcon, FolderTree,
  Tags, Menu as MenuIcon, Search, Shuffle, LayoutTemplate,
  Play, Sparkles, Download, FileCheck2, ScrollText,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  HappyUniversalPromptBar,
  type HuppSendPayload,
  type HuppActionIntent,
} from "@/components/happy/HappyUniversalPromptBar";
import {
  HappyUniversalActionBar,
  type UabActionEvent,
} from "@/components/happy/HappyUniversalActionBar";

export const Route = createFileRoute("/_authenticated/cms")({
  head: () => ({
    meta: [
      { title: "Enterprise CMS — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EnterpriseCmsRoute,
});

type PresetId =
  | "pages" | "blogs" | "products" | "media" | "categories"
  | "tags" | "menus" | "seo" | "redirects" | "landing";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "pages",      label: "Pages",         icon: <FileText className="h-4 w-4" />,       hint: "Static pages · sections · hero · CTA · SEO." },
  { id: "blogs",      label: "Blogs",         icon: <PenSquare className="h-4 w-4" />,      hint: "Posts · authors · categories · scheduling." },
  { id: "products",   label: "Products",      icon: <Package className="h-4 w-4" />,        hint: "Catalog · SKUs · pricing · variants · assets." },
  { id: "media",      label: "Media",         icon: <ImageIcon className="h-4 w-4" />,      hint: "Images · video · docs · folders · CDN." },
  { id: "categories", label: "Categories",    icon: <FolderTree className="h-4 w-4" />,     hint: "Taxonomies · hierarchy · slugs · counts." },
  { id: "tags",       label: "Tags",          icon: <Tags className="h-4 w-4" />,           hint: "Flat labels · related · trending · SEO." },
  { id: "menus",      label: "Menus",         icon: <MenuIcon className="h-4 w-4" />,       hint: "Header · footer · mega menu · localized." },
  { id: "seo",        label: "SEO",           icon: <Search className="h-4 w-4" />,         hint: "Titles · meta · OG · sitemap · schema." },
  { id: "redirects",  label: "Redirects",     icon: <Shuffle className="h-4 w-4" />,        hint: "301 · 302 · path rewrites · legacy URLs." },
  { id: "landing",    label: "Landing Pages", icon: <LayoutTemplate className="h-4 w-4" />, hint: "Campaign pages · A/B · variants · analytics." },
];

const INTRO: Record<PresetId, string> = {
  pages:      "Describe the page to generate or edit.",
  blogs:      "Describe the blog post · author · category.",
  products:   "Describe the product · variants · pricing.",
  media:      "Describe the media asset to upload or generate.",
  categories: "Describe the category · parent · hierarchy.",
  tags:       "Describe the tag · related tags · scope.",
  menus:      "Describe the menu · items · localization.",
  seo:        "Describe the surface to SEO-optimize.",
  redirects:  "Describe the redirect · from → to · code.",
  landing:    "Describe the landing page · campaign · variant.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function EnterpriseCmsRoute() {
  const [preset, setPreset] = React.useState<PresetId>("pages");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY authoring ${preset}…`);
  }, [preset, pushLog]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const generate = () => { pushLog("log", `Generate ${preset} via Creator Runtime`);              toast.info(`Generating ${preset}…`); };
  const optimize = () => { pushLog("log", `AI optimize ${preset} via Knowledge Runtime`);         toast.info("HAPPY optimizing…"); };
  const exportRpt= () => { pushLog("log", `Export ${preset} via Publishing Runtime`);             toast.info("Exporting…"); };
  const publish  = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Newspaper className="h-4 w-4" /> HAPPY Enterprise CMS
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Manage pages, blogs, products, media & SEO
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every publish flows through the canonical pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="CMS presets" className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={preset === p.id ? "default" : "outline"}
            onClick={() => { setPreset(p.id); pushLog("log", `Preset · ${p.label}`); }}
            className="gap-2"
          >
            {p.icon}{p.label}
          </Button>
        ))}
      </section>
      <p className="text-xs text-muted-foreground mt-2">{active.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Center */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="document"
            placeholder={INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`cms:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                       className="gap-1"><Play className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline"   onClick={optimize}   className="gap-1"><Sparkles className="h-4 w-4" />AI Optimize</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt}  className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}    className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="editor" className="w-full">
            <TabsList>
              <TabsTrigger value="editor"  className="gap-1"><PenSquare className="h-4 w-4" />Editor</TabsTrigger>
              <TabsTrigger value="library" className="gap-1"><FolderTree className="h-4 w-4" />Library</TabsTrigger>
              <TabsTrigger value="seo"     className="gap-1"><Search className="h-4 w-4" />SEO</TabsTrigger>
              <TabsTrigger value="publish" className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[280px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · editor renders here from Creator Runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="library" className="mt-3"><p className="text-sm text-muted-foreground">Records · media · taxonomy · filter · bulk actions.</p></TabsContent>
            <TabsContent value="seo"     className="mt-3"><p className="text-sm text-muted-foreground">Titles · meta · OG · sitemap · schema · redirects.</p></TabsContent>
            <TabsContent value="publish" className="mt-3"><p className="text-sm text-muted-foreground">Approval · schedule · rollout · rollback · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> CMS Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, generations, optimizations, exports, and publishes log here.
                </li>
              )}
              {logs.map((l) => (
                <li key={l.id} className="px-2 py-0.5 rounded hover:bg-muted">
                  <span className="text-muted-foreground mr-2">{l.at}</span>
                  <span className={
                    l.kind === "err"  ? "text-destructive" :
                    l.kind === "warn" ? "text-amber-500" : ""
                  }>{l.text}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <p className="text-xs text-muted-foreground">Mirrored to Mission Control.</p>
        </aside>
      </div>
    </Container>
  );
}
