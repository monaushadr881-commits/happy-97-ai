/**
 * /builder/fullstack — HAPPY Full Stack Builder™ (R209)
 *
 * Thin presentation shell for the Full Stack AI Builder. STRICT REUSE:
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
  Layers, Server, Database, Cable, ShieldCheck, LayoutDashboard,
  Gauge, ListChecks, KeyRound, HardDrive, Rocket, Sparkles,
  FolderTree, Monitor, Tablet, Smartphone, Sun, Moon, Eye, FileCode,
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

export const Route = createFileRoute("/_authenticated/builder/fullstack")({
  head: () => ({
    meta: [
      { title: "Full Stack Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FullStackBuilderRoute,
});

type GeneratorId =
  | "frontend" | "backend" | "database" | "api" | "auth"
  | "admin" | "dashboard" | "crud" | "validation" | "rbac"
  | "storage" | "deploy";

const GENERATORS: { id: GeneratorId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "frontend",   label: "Frontend",     icon: <Layers className="h-4 w-4" />,         hint: "Generate a typed React frontend wired to HAPPY server functions." },
  { id: "backend",    label: "Backend",      icon: <Server className="h-4 w-4" />,         hint: "Generate server functions on the canonical pipeline." },
  { id: "database",   label: "Database",     icon: <Database className="h-4 w-4" />,       hint: "Design tables, RLS, indexes, triggers via migrations." },
  { id: "api",        label: "API",          icon: <Cable className="h-4 w-4" />,          hint: "Typed API contracts + client for HAPPY server functions." },
  { id: "auth",       label: "Authentication",icon: <ShieldCheck className="h-4 w-4" />,   hint: "Email + Google sign-in with session and route gating." },
  { id: "admin",      label: "Admin Panel",  icon: <LayoutDashboard className="h-4 w-4" />,hint: "Admin surface reusing canonical tables and forms." },
  { id: "dashboard",  label: "Dashboard",    icon: <Gauge className="h-4 w-4" />,          hint: "KPI dashboard reusing Mission Control widgets." },
  { id: "crud",       label: "CRUD",         icon: <ListChecks className="h-4 w-4" />,     hint: "List / detail / create / edit / delete for an entity." },
  { id: "validation", label: "Validation",   icon: <ShieldCheck className="h-4 w-4" />,    hint: "Zod schemas shared by form, server-fn, and database." },
  { id: "rbac",       label: "RBAC",         icon: <KeyRound className="h-4 w-4" />,       hint: "Role table + has_role() + policies + route gates." },
  { id: "storage",    label: "Storage",      icon: <HardDrive className="h-4 w-4" />,      hint: "Buckets + upload + signed URLs + RLS on objects." },
  { id: "deploy",     label: "Deployment",   icon: <Rocket className="h-4 w-4" />,         hint: "Deployment config, envs, health checks, and rollbacks." },
];

const GENERATOR_INTRO: Record<GeneratorId, string> = {
  frontend:   "Generate frontend. Include: routes, layout, and data hooks.",
  backend:    "Generate backend. Include: server functions, middleware, and pipeline.",
  database:   "Design database. Include: tables, columns, RLS, and indexes.",
  api:        "Generate API. Include: contracts, client, and error mapping.",
  auth:       "Generate authentication. Include: email + Google + protected routes.",
  admin:      "Generate admin panel. Include: entities, filters, and bulk actions.",
  dashboard:  "Generate dashboard. Include: KPIs, charts, and drill-downs.",
  crud:       "Generate CRUD for an entity. Include: schema, forms, and list.",
  validation: "Generate validation. Include: Zod schemas + form and server hooks.",
  rbac:       "Generate RBAC. Include: roles, has_role, and policy scaffolding.",
  storage:    "Configure storage. Include: bucket, upload, and RLS on objects.",
  deploy:     "Configure deployment. Include: envs, health checks, and rollout.",
};

const ENTITY_LIBRARY = [
  "User", "Profile", "Role", "Team", "Organization", "Customer",
  "Product", "Order", "Invoice", "Payment", "Comment", "Notification",
  "File", "Setting", "Audit Log",
];

const MODULE_LIBRARY = [
  "Auth", "RBAC", "Billing", "Notifications", "Storage", "Search",
  "Analytics", "Audit", "Webhooks", "Feature Flags", "Rate Limit", "Health",
];

const PROJECT_TREE = [
  "src/",
  "  routes/",
  "    __root.tsx",
  "    index.tsx",
  "    _authenticated/",
  "      dashboard.tsx",
  "      admin.tsx",
  "      api/",
  "        v1/",
  "  lib/",
  "    founder/pipeline.ts",
  "    happy-runtime/",
  "  components/",
  "  integrations/supabase/",
  "supabase/migrations/",
];

type Device = "phone" | "tablet" | "desktop";
type ThemeMode = "light" | "dark";
interface BuildEvent { id: string; at: string; label: string; detail?: string }

function FullStackBuilderRoute() {
  const [mode, setMode] = React.useState<GeneratorId>("frontend");
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
  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "fullstack", onLog: pushLog });

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

  const deviceClass =
    device === "desktop" ? "w-full max-w-5xl aspect-[16/10]" :
    device === "tablet"  ? "w-[720px] max-w-full aspect-[4/3]" :
                            "w-[360px] max-w-full aspect-[9/19]";

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Server className="h-4 w-4" /> HAPPY Full Stack Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Build a full stack app with HAPPY
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
        {/* Left: entities + modules + project explorer */}
        <aside className="space-y-6">
          <section>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4" /> Entity Library
            </div>
            <ScrollArea className="h-40 mt-2 rounded-md border">
              <ul className="p-2 space-y-1">
                {ENTITY_LIBRARY.map((e) => (
                  <li key={e}>
                    <button
                      onClick={() => insertPreset(`Entity · ${e}`)}
                      className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted"
                    >{e}</button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </section>
          <section>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Layers className="h-4 w-4" /> Module Library
            </div>
            <ScrollArea className="h-40 mt-2 rounded-md border">
              <ul className="p-2 space-y-1">
                {MODULE_LIBRARY.map((m) => (
                  <li key={m}>
                    <button
                      onClick={() => insertPreset(`Module · ${m}`)}
                      className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted"
                    >{m}</button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </section>
          <section>
            <div className="flex items-center gap-2 text-sm font-medium">
              <FolderTree className="h-4 w-4" /> Project Explorer
            </div>
            <ScrollArea className="h-56 mt-2 rounded-md border">
              <ul className="p-2 font-mono text-xs whitespace-pre">
                {PROJECT_TREE.map((line, i) => (
                  <li key={i} className="px-2 py-0.5 rounded hover:bg-muted">{line}</li>
                ))}
              </ul>
            </ScrollArea>
          </section>
        </aside>

        {/* Center: composer + preview */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="fullstack-app"
            placeholder={GENERATOR_INTRO[mode]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`fullstack:${mode}`}
            onAction={onBarAction}
          />

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"  className="gap-1"><Eye className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="schema"   className="gap-1"><Database className="h-4 w-4" />Schema</TabsTrigger>
              <TabsTrigger value="api"      className="gap-1"><Cable className="h-4 w-4" />API</TabsTrigger>
              <TabsTrigger value="deploy"   className="gap-1"><Rocket className="h-4 w-4" />Deploy</TabsTrigger>
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
                  <iframe src={previewUrl} title="Full stack preview" className="w-full h-full" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Ask HAPPY to design tables in the composer. Schema changes are
                emitted as migrations reviewed before execution — no ad-hoc DDL.
              </p>
              <ul className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                {ENTITY_LIBRARY.slice(0, 9).map((e) => (
                  <li key={e} className="border rounded p-3 text-sm flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />{e}
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="api" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Server functions run on the canonical pipeline. Ask HAPPY to add
                endpoints; contracts are typed and shared with the client.
              </p>
            </TabsContent>

            <TabsContent value="deploy" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Deployment config, environment secrets, health checks, and
                rollouts are orchestrated by the Publishing Runtime and surfaced
                in Mission Control.
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
