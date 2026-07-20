/**
 * /builder/ui — HAPPY UI/UX Builder™ (R217)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Publishing runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Palette, LayoutDashboard, ShieldCheck, Smartphone, Rocket,
  MonitorSmartphone, Sun, Moon, Sparkles, Figma, SwatchBook,
  Ruler, Monitor, Tablet,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

export const Route = createFileRoute("/_authenticated/builder/ui")({
  head: () => ({
    meta: [
      { title: "UI/UX Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UiBuilderRoute,
});

type PresetId =
  | "landing" | "dashboard" | "admin" | "mobile"
  | "responsive" | "animations" | "figma" | "theme" | "tokens";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "landing",     label: "Landing Pages",       icon: <Rocket className="h-4 w-4" />,           hint: "Hero · features · social proof · CTA sections." },
  { id: "dashboard",   label: "Dashboards",          icon: <LayoutDashboard className="h-4 w-4" />,  hint: "Nav · KPI · charts · tables · empty states." },
  { id: "admin",       label: "Admin Panels",        icon: <ShieldCheck className="h-4 w-4" />,      hint: "Users · roles · settings · audit surfaces." },
  { id: "mobile",      label: "Mobile UI",           icon: <Smartphone className="h-4 w-4" />,       hint: "Safe areas · tabs · sheets · touch targets." },
  { id: "responsive",  label: "Responsive Layouts",  icon: <MonitorSmartphone className="h-4 w-4" />,hint: "Mobile → tablet → desktop breakpoints." },
  { id: "animations",  label: "Animations",          icon: <Sparkles className="h-4 w-4" />,         hint: "fade-in · scale-in · hover-scale · story-link." },
  { id: "figma",       label: "Figma Style Components", icon: <Figma className="h-4 w-4" />,         hint: "Card · Button · Modal · Nav · Toast systems." },
  { id: "theme",       label: "Theme Generator",     icon: <SwatchBook className="h-4 w-4" />,       hint: "Palettes · fonts · radii · shadows." },
  { id: "tokens",      label: "Design Tokens",       icon: <Ruler className="h-4 w-4" />,            hint: "Semantic tokens in src/styles.css only." },
];

const PRESET_INTRO: Record<PresetId, string> = {
  landing:    "Describe the product, audience, and hero angle.",
  dashboard:  "Describe the KPIs, tables, and primary tasks.",
  admin:      "Describe users, roles, and admin surfaces.",
  mobile:     "Describe screens, tabs, and touch flows.",
  responsive: "Describe breakpoint behavior across mobile → desktop.",
  animations: "Describe the motion register and interaction feel.",
  figma:      "Describe the component set: buttons, cards, modals, nav.",
  theme:      "Describe palette, mood, typography, and radius.",
  tokens:     "Describe the semantic token names and roles.",
};

type Device = "desktop" | "tablet" | "mobile";
type Mode = "light" | "dark";

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function UiBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("landing");
  const [device, setDevice] = React.useState<Device>("desktop");
  const [mode, setMode]     = React.useState<Mode>("light");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);
  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "ui", onLog: pushLog });

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset} [${device}/${mode}]: ${p.prompt.slice(0, 160)}`);
    void __submitPrompt(String(preset), p.prompt, p.attachments?.length ?? 0);
  }, [preset, device, mode, pushLog, __submitPrompt]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const generate = () => { pushLog("log", `Generate ${preset} via Creator Runtime`); toast.info(`Generating ${preset}…`); };
  const exportTokens = () => { pushLog("log", `Export design tokens → src/styles.css`); toast.info("Exporting tokens…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;
  const frameW = device === "mobile" ? 375 : device === "tablet" ? 768 : 1200;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Palette className="h-4 w-4" /> HAPPY UI/UX Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Design interfaces with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every artifact uses semantic tokens from <code>src/styles.css</code>.
            No hardcoded colors, no parallel design system.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="UI presets" className="flex flex-wrap gap-2">
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
      <p className="text-xs text-muted-foreground mt-2">{activePreset.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Center: composer + preview */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="uiux"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`ui:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 border rounded p-1">
              <Button size="sm" variant={device === "desktop" ? "default" : "ghost"} onClick={() => setDevice("desktop")} className="gap-1"><Monitor className="h-4 w-4" />Desktop</Button>
              <Button size="sm" variant={device === "tablet"  ? "default" : "ghost"} onClick={() => setDevice("tablet")}  className="gap-1"><Tablet className="h-4 w-4" />Tablet</Button>
              <Button size="sm" variant={device === "mobile"  ? "default" : "ghost"} onClick={() => setDevice("mobile")}  className="gap-1"><Smartphone className="h-4 w-4" />Mobile</Button>
            </div>
            <div className="flex items-center gap-1 border rounded p-1">
              <Button size="sm" variant={mode === "light" ? "default" : "ghost"} onClick={() => setMode("light")} className="gap-1"><Sun className="h-4 w-4" />Light</Button>
              <Button size="sm" variant={mode === "dark"  ? "default" : "ghost"} onClick={() => setMode("dark")}  className="gap-1"><Moon className="h-4 w-4" />Dark</Button>
            </div>
            <Button size="sm" onClick={generate}                    className="gap-1"><Sparkles className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline" onClick={exportTokens} className="gap-1"><Ruler className="h-4 w-4" />Export Tokens</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview" className="gap-1"><Monitor className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="tokens"  className="gap-1"><Ruler className="h-4 w-4" />Tokens</TabsTrigger>
              <TabsTrigger value="components" className="gap-1"><Figma className="h-4 w-4" />Components</TabsTrigger>
              <TabsTrigger value="motion"  className="gap-1"><Sparkles className="h-4 w-4" />Motion</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div className={mode === "dark" ? "dark" : ""}>
                <div
                  className="mx-auto border rounded-lg bg-background text-foreground overflow-hidden transition-all"
                  style={{ width: "100%", maxWidth: frameW, height: 560 }}
                >
                  <div className="h-full grid place-items-center text-sm text-muted-foreground">
                    Preview at {frameW}px · {mode} · {activePreset.label}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="tokens" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Tokens land in <code>src/styles.css</code> under <code>@theme inline</code> —
                semantic only. No <code>text-white</code> / <code>bg-black</code> utilities in components.
              </p>
            </TabsContent>
            <TabsContent value="components" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Component set drafts against shadcn primitives. Figma-style variants
                map to canonical Button, Card, Modal, Nav, and Toast.
              </p>
            </TabsContent>
            <TabsContent value="motion" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Motion uses the built-in <code>animate-fade-in</code>, <code>animate-scale-in</code>,
                <code>hover-scale</code>, and <code>story-link</code> utilities.
              </p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: build log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Build Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, generations, and export events log here.
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
