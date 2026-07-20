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
  Sun, Moon, Eye, Boxes, LayoutGrid, Layers, Globe,
  Building2, Rocket, Utensils, Hospital, School, GraduationCap,
  Hotel, Home as HomeIcon, HeartHandshake, Factory, Filter,
  BookMarked, LifeBuoy, Users, Truck, ShieldCheck,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useBuilderPrompt } from "@/hooks/use-builder-prompt";
import {
  HappyUniversalPromptBar,
  type HuppSendPayload,
  type HuppActionIntent,
} from "@/components/happy/HappyUniversalPromptBar";
import {
  HappyUniversalActionBar,
  type UabActionEvent,
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
  | "ai" | "landing" | "funnel" | "business" | "startup" | "corporate"
  | "portfolio" | "agency" | "ecommerce" | "restaurant" | "hospital"
  | "pharmacy" | "school" | "college" | "hotel" | "realestate"
  | "ngo" | "manufacturing" | "blog" | "docs" | "knowledge"
  | "customer-portal" | "dealer-portal" | "distributor-portal"
  | "admin-dashboard" | "cms" | "multipage" | "theme" | "seo" | "responsive";

const GENERATORS: {
  id: GeneratorId;
  label: string;
  icon: React.ReactNode;
  hint: string;
}[] = [
  { id: "ai",                  label: "AI Website",           icon: <Sparkles className="h-4 w-4" />,       hint: "Describe the site — HAPPY drafts structure, copy, and theme." },
  { id: "landing",             label: "Landing Page",         icon: <LayoutTemplate className="h-4 w-4" />, hint: "One high-converting page: hero, features, proof, CTA." },
  { id: "funnel",              label: "Funnel",               icon: <Filter className="h-4 w-4" />,         hint: "Multi-step conversion funnel: opt-in → offer → checkout → upsell." },
  { id: "corporate",           label: "Corporate",            icon: <Building2 className="h-4 w-4" />,      hint: "Enterprise site: investors, leadership, press, careers." },
  { id: "startup",             label: "Startup",              icon: <Rocket className="h-4 w-4" />,         hint: "Product story, waitlist, pricing, roadmap." },
  { id: "business",            label: "Business",             icon: <Store className="h-4 w-4" />,          hint: "Home / About / Services / Contact with SEO basics." },
  { id: "portfolio",           label: "Portfolio",            icon: <Briefcase className="h-4 w-4" />,      hint: "Case studies, gallery, about, contact." },
  { id: "agency",              label: "Agency",               icon: <Users className="h-4 w-4" />,          hint: "Services, work, team, testimonials, inquiry form." },
  { id: "ecommerce",           label: "Ecommerce",            icon: <ShoppingCart className="h-4 w-4" />,   hint: "Catalog, PDP, cart, checkout wired to Business Runtime." },
  { id: "restaurant",          label: "Restaurant",           icon: <Utensils className="h-4 w-4" />,       hint: "Menu, reservations, gallery, locations, orders." },
  { id: "hospital",            label: "Hospital",             icon: <Hospital className="h-4 w-4" />,       hint: "Departments, doctors, appointments, patient portal." },
  { id: "pharmacy",            label: "Pharmacy",             icon: <LifeBuoy className="h-4 w-4" />,       hint: "Catalog, prescription upload, delivery, wellness content." },
  { id: "school",              label: "School",               icon: <School className="h-4 w-4" />,         hint: "Academics, admissions, faculty, calendar, parent portal." },
  { id: "college",             label: "College",              icon: <GraduationCap className="h-4 w-4" />,  hint: "Programs, faculty, research, admissions, student life." },
  { id: "hotel",               label: "Hotel",                icon: <Hotel className="h-4 w-4" />,          hint: "Rooms, amenities, booking, reviews, gallery." },
  { id: "realestate",          label: "Real Estate",          icon: <HomeIcon className="h-4 w-4" />,       hint: "Listings, map search, agents, mortgage, inquiries." },
  { id: "ngo",                 label: "NGO",                  icon: <HeartHandshake className="h-4 w-4" />, hint: "Mission, programs, impact, donate, volunteer." },
  { id: "manufacturing",       label: "Manufacturing",        icon: <Factory className="h-4 w-4" />,        hint: "Products, capabilities, quality, distributors, RFQ." },
  { id: "blog",                label: "Blog",                 icon: <BookOpen className="h-4 w-4" />,       hint: "Index, post, tag, and author pages with RSS-ready SEO." },
  { id: "docs",                label: "Documentation",        icon: <BookMarked className="h-4 w-4" />,     hint: "Docs site: guides, API reference, search, versions." },
  { id: "knowledge",           label: "Knowledge Base",       icon: <FileText className="h-4 w-4" />,       hint: "Help center: categories, articles, search, feedback." },
  { id: "customer-portal",     label: "Customer Portal",      icon: <Users className="h-4 w-4" />,          hint: "Account, orders, invoices, support tickets." },
  { id: "dealer-portal",       label: "Dealer Portal",        icon: <Truck className="h-4 w-4" />,          hint: "Dealer login, pricing, orders, claims, training." },
  { id: "distributor-portal",  label: "Distributor Portal",   icon: <Truck className="h-4 w-4" />,          hint: "Inventory, allocations, reports, POS integrations." },
  { id: "admin-dashboard",     label: "Admin Dashboard",      icon: <ShieldCheck className="h-4 w-4" />,    hint: "Ops console: KPIs, tables, forms, roles, audit." },
  { id: "cms",                 label: "CMS Website",          icon: <FileText className="h-4 w-4" />,       hint: "Editable pages backed by Knowledge + Workspace." },
  { id: "multipage",           label: "Multi-page",           icon: <Files className="h-4 w-4" />,          hint: "Sitemap-first: choose 5–30 pages, HAPPY generates each." },
  { id: "theme",               label: "Theme",                icon: <Palette className="h-4 w-4" />,        hint: "Tokens, typography, and component skins." },
  { id: "seo",                 label: "SEO",                  icon: <Search className="h-4 w-4" />,         hint: "Meta, OG, JSON-LD, sitemap.xml, robots." },
  { id: "responsive",          label: "Responsive",           icon: <Smartphone className="h-4 w-4" />,     hint: "Tune breakpoints and mobile-first layouts." },
];

const GENERATOR_INTRO: Record<GeneratorId, string> = {
  ai:                   "Generate a complete AI-designed website. Include: goal, audience, tone.",
  landing:              "Generate a landing page. Include: product name, headline promise, primary CTA.",
  funnel:               "Generate a conversion funnel. Include: offer, steps, upsell, and success page.",
  corporate:            "Generate a corporate website. Include: company, investors, leadership, careers.",
  startup:              "Generate a startup site. Include: product, waitlist, pricing, roadmap.",
  business:             "Generate a business website. Include: company name, offerings, and location.",
  portfolio:            "Generate a portfolio site. Include: profession, 3–6 case studies, and contact.",
  agency:               "Generate an agency site. Include: services, case studies, team, contact.",
  ecommerce:            "Generate an ecommerce site. Include: catalog scope, currency, and payment plan.",
  restaurant:           "Generate a restaurant site. Include: cuisine, menu highlights, reservations, hours.",
  hospital:             "Generate a hospital site. Include: departments, specialties, doctors, appointments.",
  pharmacy:             "Generate a pharmacy site. Include: catalog, prescription flow, delivery zones.",
  school:               "Generate a school site. Include: academics, admissions, faculty, calendar.",
  college:              "Generate a college site. Include: programs, faculty, research, student life.",
  hotel:                "Generate a hotel site. Include: rooms, amenities, booking, gallery.",
  realestate:           "Generate a real-estate site. Include: listings, filters, agents, inquiries.",
  ngo:                  "Generate an NGO site. Include: mission, programs, impact, donate CTA.",
  manufacturing:        "Generate a manufacturing site. Include: products, capabilities, distributors, RFQ.",
  blog:                 "Generate a blog. Include: niche, tone, and first 3 post ideas.",
  docs:                 "Generate a documentation site. Include: product, sections, versioning.",
  knowledge:            "Generate a knowledge base. Include: categories and top 10 articles.",
  "customer-portal":    "Generate a customer portal. Include: account, orders, invoices, support.",
  "dealer-portal":      "Generate a dealer portal. Include: pricing, orders, claims, training.",
  "distributor-portal": "Generate a distributor portal. Include: inventory, allocations, reports.",
  "admin-dashboard":    "Generate an admin dashboard. Include: KPIs, tables, forms, roles, audit.",
  cms:                  "Generate a CMS-driven site. Include: page types and who edits.",
  multipage:            "Generate a multi-page site. Include: sitemap outline.",
  theme:                "Generate a theme. Include: brand mood, colors, and typography direction.",
  seo:                  "Generate SEO metadata for the current site (titles, descriptions, OG, JSON-LD).",
  responsive:           "Optimize the current site for mobile, tablet, and desktop breakpoints.",
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
  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "website" });

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushEvent(`Generate · ${mode}`, p.prompt.slice(0, 160));
    void __submitPrompt(String(mode), p.prompt, p.attachments?.length ?? 0);
  }, [mode, pushEvent, __submitPrompt]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushEvent(`Prompt action · ${intent}`);
  }, [pushEvent]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushEvent(`Bar action · ${e.id}`);
    if (e.id.startsWith("export.")) toast.info("Export forwarded to Publishing Runtime…");
    if (e.id.startsWith("edit."))   toast.info("AI edit forwarded to Creator Runtime.");
    if (e.id.startsWith("build.") || e.id.startsWith("publish.")) toast.info("Forwarded to canonical runtime.");
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
            defaultSurface="website"
            placeholder={GENERATOR_INTRO[mode]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`website:${mode}`}
            onAction={onBarAction}
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
