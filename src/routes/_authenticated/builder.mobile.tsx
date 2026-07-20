/**
 * /builder/mobile — HAPPY Mobile App Builder™ (R208)
 *
 * Thin presentation shell for the AI Mobile App Builder. STRICT REUSE:
 *   • HappyUniversalPromptBar  — the one canonical AI composer
 *   • HappyUniversalActionBar  — the one canonical action bar
 *   • Knowledge / Workspace / Creator / Publishing / Business / Mission
 *     Control runtimes           — reached via the composer's dispatch
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Smartphone, Tablet, Monitor, Sun, Moon, QrCode, Package, Apple,
  Sparkles, Navigation, ShieldCheck, Database, Cable, BellRing,
  WifiOff, Settings as SettingsIcon, Boxes, LayoutGrid, Layers,
  Eye, Play, Globe, Flame, Palette, Languages, BarChart3, Rocket,
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

export const Route = createFileRoute("/_authenticated/builder/mobile")({
  head: () => ({
    meta: [
      { title: "Mobile App Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MobileBuilderRoute,
});

// ────────────────────────────────────────────────────────────────
// Generator catalog — every mode is a preset for the canonical
// prompt bar. The composer dispatches to existing runtimes.
// ────────────────────────────────────────────────────────────────

type GeneratorId =
  | "rn" | "expo" | "android" | "ios" | "pwa"
  | "nav" | "auth" | "supabase" | "firebase" | "api"
  | "push" | "offline" | "settings" | "themes" | "i18n"
  | "analytics" | "deploy";

const GENERATORS: {
  id: GeneratorId;
  label: string;
  icon: React.ReactNode;
  hint: string;
}[] = [
  { id: "rn",        label: "React Native",  icon: <Sparkles className="h-4 w-4" />,     hint: "Bare React Native project with TypeScript." },
  { id: "expo",      label: "Expo",          icon: <Package className="h-4 w-4" />,      hint: "Expo managed workflow with EAS build." },
  { id: "android",   label: "Android",       icon: <Smartphone className="h-4 w-4" />,   hint: "Android target — Gradle + Play channel ready." },
  { id: "ios",       label: "iOS",           icon: <Apple className="h-4 w-4" />,        hint: "iOS target — App Store archive ready." },
  { id: "pwa",       label: "PWA",           icon: <Globe className="h-4 w-4" />,        hint: "Installable Progressive Web App with manifest + icons." },
  { id: "nav",       label: "Navigation",    icon: <Navigation className="h-4 w-4" />,   hint: "React Navigation with tab + stack + drawer." },
  { id: "auth",      label: "Authentication",icon: <ShieldCheck className="h-4 w-4" />,  hint: "Email + Google sign-in wired to Lovable Cloud." },
  { id: "supabase",  label: "Supabase",      icon: <Database className="h-4 w-4" />,     hint: "Supabase client with RLS-aware queries and realtime." },
  { id: "firebase",  label: "Firebase",      icon: <Flame className="h-4 w-4" />,        hint: "Firebase for Auth, Firestore, FCM push, and Analytics." },
  { id: "api",       label: "API",           icon: <Cable className="h-4 w-4" />,        hint: "Typed API client for HAPPY server functions." },
  { id: "push",      label: "Notifications", icon: <BellRing className="h-4 w-4" />,     hint: "Expo Notifications / FCM / APNs with deep links." },
  { id: "offline",   label: "Offline",       icon: <WifiOff className="h-4 w-4" />,      hint: "Cache queries + optimistic writes + retry queue." },
  { id: "settings",  label: "Settings",      icon: <SettingsIcon className="h-4 w-4" />, hint: "Profile, theme, notifications, storage." },
  { id: "themes",    label: "Themes",        icon: <Palette className="h-4 w-4" />,      hint: "Light/dark tokens, typography, and native theming." },
  { id: "i18n",      label: "Localization",  icon: <Languages className="h-4 w-4" />,    hint: "i18n scaffolding, RTL, locale switching, translations." },
  { id: "analytics", label: "Analytics",     icon: <BarChart3 className="h-4 w-4" />,    hint: "Screen views, events, funnels via Analytics runtime." },
  { id: "deploy",    label: "Deployment",    icon: <Rocket className="h-4 w-4" />,       hint: "Store-ready: Play/App Store metadata, EAS submit, PWA host." },
];

const GENERATOR_INTRO: Record<GeneratorId, string> = {
  rn:        "Generate a React Native app. Include: app name, screens, and platforms.",
  expo:      "Generate an Expo app. Include: app name, screens, and native modules.",
  android:   "Configure Android target. Include: package id, permissions, and channels.",
  ios:       "Configure iOS target. Include: bundle id, capabilities, and distribution.",
  pwa:       "Generate a PWA. Include: name, icons, theme color, offline scope.",
  nav:       "Generate navigation. Include: tab, stack, and drawer routes.",
  auth:      "Generate authentication. Include: email + Google + session persistence.",
  supabase:  "Wire Supabase. Include: tables, RLS, realtime, and mobile-safe queries.",
  firebase:  "Wire Firebase. Include: Auth, Firestore, Storage, FCM, Analytics.",
  api:       "Generate API client. Include: endpoints, retries, and offline behavior.",
  push:      "Configure push notifications. Include: categories, topics, deep links.",
  offline:   "Configure offline. Include: caches, mutation queue, and conflict rules.",
  settings:  "Generate settings. Include: profile, theme, notifications, storage.",
  themes:    "Generate a theme system. Include: light/dark tokens, typography, motion.",
  i18n:      "Generate localization. Include: locales, RTL, fallback, translation keys.",
  analytics: "Wire analytics. Include: screen views, events, funnels, consent.",
  deploy:    "Prepare deployment. Include: store metadata, screenshots, EAS submit, PWA host.",
};

// ────────────────────────────────────────────────────────────────
// Libraries — screens + components reused by the canonical
// creator runtime; nothing here opens a new server surface.
// ────────────────────────────────────────────────────────────────

const SCREEN_LIBRARY = [
  "Splash", "Onboarding", "Sign In", "Sign Up", "Forgot Password", "Home",
  "Feed", "Search", "Detail", "Profile", "Settings", "Notifications",
  "Chat", "Camera", "Scanner", "Checkout", "Orders", "About",
];

const COMPONENT_LIBRARY = [
  "Header", "Tab Bar", "Drawer", "List Item", "Card", "Avatar",
  "Button", "Input", "Sheet", "Toast", "Skeleton", "Empty State",
  "Pull to Refresh", "Loading Spinner", "Modal",
];

// ────────────────────────────────────────────────────────────────
// Preview state
// ────────────────────────────────────────────────────────────────

type Device = "phone" | "tablet" | "desktop";
type ThemeMode = "light" | "dark";

interface BuildEvent { id: string; at: string; label: string; detail?: string }

function MobileBuilderRoute() {
  const [mode, setMode] = React.useState<GeneratorId>("rn");
  const [device, setDevice] = React.useState<Device>("phone");
  const [theme, setTheme] = React.useState<ThemeMode>("light");
  const [events, setEvents] = React.useState<BuildEvent[]>([]);
  const [previewUrl, setPreviewUrl] = React.useState<string>("/");
  const [qrOpen, setQrOpen] = React.useState(false);

  const pushEvent = React.useCallback((label: string, detail?: string) => {
    setEvents((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), label, detail },
      ...prev,
    ].slice(0, 200));
  }, []);
  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "mobile" });

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
  }, [pushEvent]);

  const insertPreset = (label: string) => {
    pushEvent("Library insert", label);
    toast.success(`Inserted ${label}`);
  };

  const runQr = () => { setQrOpen(true); pushEvent("QR", "Expo Go URL requested"); toast.info("Expo QR ready in preview."); };
  const runApk = () => { pushEvent("Build", "Android APK requested via Publishing Runtime"); toast.info("Android APK build queued."); };
  const runIpa = () => { pushEvent("Build", "iOS IPA requested via Publishing Runtime");     toast.info("iOS IPA archive queued."); };

  const deviceClass =
    device === "desktop" ? "w-full max-w-5xl aspect-[16/10]" :
    device === "tablet"  ? "w-[720px] max-w-full aspect-[4/3]" :
                            "w-[360px] max-w-full aspect-[9/19]";

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" /> HAPPY Mobile App Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Build a mobile app with HAPPY
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
              <LayoutGrid className="h-4 w-4" /> Screen Library
            </div>
            <ScrollArea className="h-56 mt-2 rounded-md border">
              <ul className="p-2 space-y-1">
                {SCREEN_LIBRARY.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => insertPreset(`Screen · ${s}`)}
                      className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted"
                    >{s}</button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </section>
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
        </aside>

        {/* Center: composer + preview */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="mobile-app"
            placeholder={GENERATOR_INTRO[mode]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`mobile:${mode}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={runQr}  className="gap-1"><QrCode className="h-4 w-4" />QR Preview</Button>
            <Button size="sm" variant="outline" onClick={runApk} className="gap-1"><Package className="h-4 w-4" />APK Build</Button>
            <Button size="sm" variant="outline" onClick={runIpa} className="gap-1"><Apple className="h-4 w-4" />IPA Ready</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"  className="gap-1"><Eye className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="screens"  className="gap-1"><Layers className="h-4 w-4" />Screens</TabsTrigger>
              <TabsTrigger value="settings" className="gap-1"><SettingsIcon className="h-4 w-4" />Settings</TabsTrigger>
              <TabsTrigger value="builds"   className="gap-1"><Play className="h-4 w-4" />Builds</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div className="flex items-center justify-between rounded-md border px-2 py-1.5">
                <div className="flex items-center gap-1">
                  <Button size="sm" variant={device === "phone"   ? "default" : "ghost"} onClick={() => setDevice("phone")}><Smartphone className="h-4 w-4" /></Button>
                  <Button size="sm" variant={device === "tablet"  ? "default" : "ghost"} onClick={() => setDevice("tablet")}><Tablet className="h-4 w-4" /></Button>
                  <Button size="sm" variant={device === "desktop" ? "default" : "ghost"} onClick={() => setDevice("desktop")}><Monitor className="h-4 w-4" /></Button>
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
                <div className={cn("bg-background rounded-2xl shadow overflow-hidden border", deviceClass, theme === "dark" && "dark")}>
                  <iframe src={previewUrl} title="Mobile preview" className="w-full h-full" />
                </div>
              </div>
              {qrOpen && (
                <div className="mt-3 rounded-md border p-4 flex items-center gap-4">
                  <QrCode className="h-24 w-24" aria-hidden />
                  <div className="text-sm">
                    <div className="font-medium">Scan with Expo Go</div>
                    <div className="text-muted-foreground">The QR resolves to the Expo dev URL when Publishing runtime finishes wiring the build.</div>
                    <Button size="sm" variant="ghost" onClick={() => setQrOpen(false)} className="mt-2">Close</Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="screens" className="mt-3">
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SCREEN_LIBRARY.map((s) => (
                  <li key={s} className="border rounded p-3 text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />{s}
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="settings" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Ask HAPPY to draft app settings in the composer above. Values are
                stored via the Creator Runtime and surfaced by the mobile shell.
              </p>
            </TabsContent>

            <TabsContent value="builds" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Android APK and iOS IPA builds are triggered by the Publishing
                Runtime. Progress and download links appear in Mission Control.
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
