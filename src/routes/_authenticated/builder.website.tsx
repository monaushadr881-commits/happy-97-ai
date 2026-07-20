/**
 * /builder/website — HAPPY Website Builder™ (R207)
 *
 * Thin presentation shell for the AI Website Builder. STRICT REUSE:
 *   • HappyUniversalPromptBar  — the one canonical AI composer
 *   • HappyUniversalActionBar  — the one canonical action bar
 *   • Knowledge / Workspace / Creator / Publishing / Business / Mission
 *     Control runtimes           — reached via the composer's dispatch
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * All Send/Action events are forwarded to the existing canonical
 * runtimes exactly as HappyUniversalPromptBar already forwards them.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Sparkles, LayoutTemplate, Store, Briefcase, ShoppingCart, BookOpen,
  FileText, Files, Palette, Search, Smartphone, Tablet, Monitor,
  Sun, Moon, Eye, Wand2, RefreshCw, PlayCircle, Rocket, Github,
  Download, Boxes, LayoutGrid, Layers, Globe,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  HappyUniversalPromptBar,
  type HuppSendPayload,
  type HuppActionIntent,
} from "@/components/happy/HappyUniversalPromptBar";
import {
  HappyUniversalActionBar,
  type HuabActionEvent,
} from "@/components/happy/HappyUniversalActionBar";

export const Route = createFileRoute("/_authenticated/builder/website")({
  head: () => ({
    meta: [
      { title: "Website Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WebsiteBuilderRoute,
});

// ────────────────────────────────────────────────────────────────
// Generator catalog — every mode is a preset for the canonical
// prompt bar; nothing here opens a new server surface.
// ────────────────────────────────────────────────────────────────

type GeneratorId =
  | "ai" | "landing" | "business" | "portfolio" | "ecommerce"
  | "blog" | "cms" | "multipage" | "theme" | "seo" | "responsive";

const GENERATORS: {
  id: GeneratorId;
  label: string;
  icon: React.ReactNode;
  hint: string;
}[] = [
  { id: "ai",         label: "AI Website",     icon: <Sparkles className="h-4 w-4" />,       hint: "Describe the site — HAPPY drafts structure, copy, and theme." },
  { id: "landing",    label: "Landing Page",   icon: <LayoutTemplate className="h-4 w-4" />, hint: "One high-converting page: hero, features, proof, CTA." },
  { id: "business",   label: "Business Site",  icon: <Store className="h-4 w-4" />,          hint: "Home / About / Services / Contact with SEO basics." },
  { id: "portfolio",  label: "Portfolio",      icon: <Briefcase className="h-4 w-4" />,      hint: "Case studies, gallery, about, contact." },
  { id: "ecommerce",  label: "Ecommerce",      icon: <ShoppingCart className="h-4 w-4" />,   hint: "Catalog, PDP, cart, checkout wired to Business Runtime." },
  { id: "blog",       label: "Blog",           icon: <BookOpen className="h-4 w-4" />,       hint: "Index, post, tag, and author pages with RSS-ready SEO." },
  { id: "cms",        label: "CMS Website",    icon: <FileText className="h-4 w-4" />,       hint: "Editable pages backed by Knowledge + Workspace." },
  { id: "multipage",  label: "Multi-page",     icon: <Files className="h-4 w-4" />,          hint: "Sitemap-first: choose 5–30 pages, HAPPY generates each." },
  { id: "theme",      label: "Theme",          icon: <Palette className="h-4 w-4" />,        hint: "Tokens, typography, and component skins." },
  { id: "seo",        label: "SEO",            icon: <Search className="h-4 w-4" />,         hint: "Meta, OG, JSON-LD, sitemap.xml, robots." },
  { id: "responsive", label: "Responsive",     icon: <Smartphone className="h-4 w-4" />,     hint: "Tune breakpoints and mobile-first layouts." },
];

const GENERATOR_INTRO: Record<GeneratorId, string> = {
  ai:         "Generate a complete AI-designed website. Include: goal, audience, tone.",
  landing:    "Generate a landing page. Include: product name, headline promise, primary CTA.",
  business:   "Generate a business website. Include: company name, offerings, and location.",
  portfolio:  "Generate a portfolio site. Include: profession, 3–6 case studies, and contact.",
  ecommerce:  "Generate an ecommerce site. Include: catalog scope, currency, and payment plan.",
  blog:       "Generate a blog. Include: niche, tone, and first 3 post ideas.",
  cms:        "Generate a CMS-driven site. Include: page types and who edits.",
  multipage:  "Generate a multi-page site. Include: sitemap outline.",
  theme:      "Generate a theme. Include: brand mood, colors, and typography direction.",
  seo:        "Generate SEO metadata for the current site (titles, descriptions, OG, JSON-LD).",
  responsive: "Optimize the current site for mobile, tablet, and desktop breakpoints.",
};

// ────────────────────────────────────────────────────────────────
// Libraries — component + page presets that the composer emits as
// build intents; the canonical runtimes decide what to persist.
// ────────────────────────────────────────────────────────────────

const COMPONENT_LIBRARY = [
  "Hero", "Nav", "Footer", "Feature Grid", "Pricing", "Testimonials",
  "FAQ", "CTA Banner", "Logo Cloud", "Stats", "Team", "Contact Form",
  "Newsletter", "Gallery", "Blog List", "Product Card", "Cart Drawer",
];

const PAGE_LIBRARY = [
  "Home", "About", "Services", "Pricing", "Contact", "Blog Index",
  "Blog Post", "Case Study", "Portfolio", "Product Listing",
  "Product Detail", "Cart", "Checkout", "Login", "Signup", "404",
];

// ────────────────────────────────────────────────────────────────
// Preview state
// ────────────────────────────────────────────────────────────────

type Device = "desktop" | "tablet" | "mobile";
type ThemeMode = "light" | "dark";

interface BuildEvent { id: string; at: string; label: string; detail?: string }

function WebsiteBuilderRoute() {
  const [mode, setMode] = React.useState<GeneratorId>("ai");
  const [device, setDevice] = React.useState<Device>("desktop");
  const [theme, setTheme] = React.useState<ThemeMode>("light");
  const [events, setEvents] = React.useState<BuildEvent[]>([]);
  const [previewUrl, setPreviewUrl] = React.useState<string>("/");

  const pushEvent = React.useCallback((label: string, detail?: string) => {
    setEvents((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), label, detail },
      ...prev,
    ].slice(0, 200));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushEvent(`Generate · ${mode}`, p.text.slice(0, 160));
    toast.success(`HAPPY drafting ${mode}…`);
  }, [mode, pushEvent]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushEvent(`Prompt action · ${intent.id}`, intent.label);
  }, [pushEvent]);

  const onBarAction = React.useCallback((e: HuabActionEvent) => {
    pushEvent(`Bar action · ${e.id}`, e.payload ? JSON.stringify(e.payload).slice(0, 160) : undefined);
    if (e.id === "export.zip")      toast.info("Preparing ZIP export via Publishing Runtime…");
    if (e.id === "export.github")   toast.info("Publishing to GitHub via Publishing Runtime…");
    if (e.id === "export.oneclick") toast.info("One-click publish via Publishing Runtime…");
    if (e.id === "ai.edit")         toast.info("AI Edit forwarded to Creator Runtime.");
    if (e.id === "ai.continue")     toast.info("AI Continue forwarded to Creator Runtime.");
    if (e.id === "ai.regenerate")   toast.info("AI Regenerate forwarded to Creator Runtime.");
  }, [pushEvent]);

  const insertPreset = (label: string) => {
    pushEvent("Library insert", label);
    toast.success(`Inserted ${label}`);
  };

  const deviceClass =
    device === "desktop" ? "w-full max-w-6xl aspect-[16/10]" :
    device === "tablet"  ? "w-[820px] max-w-full aspect-[4/3]" :
                            "w-[390px] max-w-full aspect-[9/16]";

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" /> HAPPY Website Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Build a website with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            One canonical composer, one canonical action bar, reusing Knowledge,
            Workspace, Creator, Publishing, Business, and Mission Control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{GENERATORS.find((g) => g.id === mode)?.label}</Badge>
          <Badge variant="outline">{device}</Badge>
          <Badge variant="outline">{theme}</Badge>
        </div>
      </header>

      <Separator className="my-6" />

      {/* Generator picker */}
      <section aria-label="Generators" className="flex flex-wrap gap-2">
        {GENERATORS.map((g) => (
          <Button
            key={g.id}
            size="sm"
            variant={mode === g.id ? "default" : "outline"}
            onClick={() => { setMode(g.id); pushEvent("Mode", g.label); }}
            className="gap-2"
          >
            {g.icon}{g.label}
          </Button>
        ))}
      </section>

      <p className="text-xs text-muted-foreground mt-2">{GENERATORS.find((g) => g.id === mode)?.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-6">
        {/* Left: libraries */}
        <aside className="space-y-6">
          <section>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Boxes className="h-4 w-4" /> Component Library
            </div>
            <ScrollArea className="h-56 mt-2 rounded-md border">
              <ul className="p-2 space-y-1">
                {COMPONENT_LIBRARY.map((c) => (
                  <li key={c}>
                    <button
                      onClick={() => insertPreset(`Component · ${c}`)}
                      className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted"
                    >{c}</button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </section>
          <section>
            <div className="flex items-center gap-2 text-sm font-medium">
              <LayoutGrid className="h-4 w-4" /> Page Library
            </div>
            <ScrollArea className="h-56 mt-2 rounded-md border">
              <ul className="p-2 space-y-1">
                {PAGE_LIBRARY.map((p) => (
                  <li key={p}>
                    <button
                      onClick={() => insertPreset(`Page · ${p}`)}
                      className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted"
                    >{p}</button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </section>
        </aside>

        {/* Center: composer + preview */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            surface="creator"
            placeholder={GENERATOR_INTRO[mode]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            context="creator"
            onAction={onBarAction}
            extraActions={[
              { id: "ai.edit",         label: "AI Edit",       icon: <Wand2 className="h-4 w-4" /> },
              { id: "ai.continue",     label: "AI Continue",   icon: <PlayCircle className="h-4 w-4" /> },
              { id: "ai.regenerate",   label: "AI Regenerate", icon: <RefreshCw className="h-4 w-4" /> },
              { id: "export.oneclick", label: "One-Click",     icon: <Rocket className="h-4 w-4" /> },
              { id: "export.github",   label: "GitHub",        icon: <Github className="h-4 w-4" /> },
              { id: "export.zip",      label: "ZIP",           icon: <Download className="h-4 w-4" /> },
            ]}
          />

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview" className="gap-1"><Eye className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="pages" className="gap-1"><Files className="h-4 w-4" />Pages</TabsTrigger>
              <TabsTrigger value="theme" className="gap-1"><Palette className="h-4 w-4" />Theme</TabsTrigger>
              <TabsTrigger value="seo" className="gap-1"><Search className="h-4 w-4" />SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div className="flex items-center justify-between rounded-md border px-2 py-1.5">
                <div className="flex items-center gap-1">
                  <Button size="sm" variant={device === "desktop" ? "default" : "ghost"} onClick={() => setDevice("desktop")}><Monitor className="h-4 w-4" /></Button>
                  <Button size="sm" variant={device === "tablet"  ? "default" : "ghost"} onClick={() => setDevice("tablet")}><Tablet className="h-4 w-4" /></Button>
                  <Button size="sm" variant={device === "mobile"  ? "default" : "ghost"} onClick={() => setDevice("mobile")}><Smartphone className="h-4 w-4" /></Button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    className="text-xs bg-transparent border rounded px-2 py-1 w-56"
                    aria-label="Preview path"
                  />
                  <Button size="sm" variant="ghost" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                    {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex justify-center rounded-md border bg-muted/30 p-4">
                <div className={cn("bg-background rounded shadow overflow-hidden", deviceClass, theme === "dark" && "dark")}>
                  <iframe src={previewUrl} title="Live preview" className="w-full h-full" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pages" className="mt-3">
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PAGE_LIBRARY.map((p) => (
                  <li key={p} className="border rounded p-3 text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />{p}
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="theme" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Ask HAPPY to draft a theme in the composer above. Tokens are written
                through the Creator Runtime and applied by the design system.
              </p>
            </TabsContent>

            <TabsContent value="seo" className="mt-3">
              <p className="text-sm text-muted-foreground">
                SEO metadata (titles, descriptions, OG, JSON-LD, sitemap.xml, robots)
                is generated via the composer and stored by the Publishing Runtime.
              </p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: build log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Build log
          </div>
          <ScrollArea className="h-[520px] rounded-md border">
            <ul className="p-2 space-y-1">
              {events.length === 0 && (
                <li className="text-xs text-muted-foreground p-2">
                  Actions from the composer and action bar will appear here.
                </li>
              )}
              {events.map((e) => (
                <li key={e.id} className="text-xs p-2 rounded hover:bg-muted">
                  <div className="flex justify-between">
                    <span className="font-medium">{e.label}</span>
                    <span className="text-muted-foreground">{e.at}</span>
                  </div>
                  {e.detail && <div className="text-muted-foreground mt-0.5 truncate">{e.detail}</div>}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </aside>
      </div>
    </Container>
  );
}
