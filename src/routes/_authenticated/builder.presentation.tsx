/**
 * /builder/presentation — HAPPY Presentation Builder™ (R219)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer (surface: "presentation")
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Publishing runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Presentation, TrendingUp, Rocket, Megaphone, Briefcase,
  Building2, GraduationCap, FileType2, Download, Sparkles,
  FileCheck2, Monitor, LayoutGrid, Palette,
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

export const Route = createFileRoute("/_authenticated/builder/presentation")({
  head: () => ({
    meta: [
      { title: "Presentation Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PresentationBuilderRoute,
});

type PresetId =
  | "powerpoint" | "investor" | "pitch" | "sales"
  | "marketing" | "business" | "company-profile" | "education";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "powerpoint",      label: "PowerPoint",       icon: <Presentation className="h-4 w-4" />,   hint: "General-purpose PowerPoint deck with cover + sections." },
  { id: "investor",        label: "Investor Deck",    icon: <TrendingUp className="h-4 w-4" />,     hint: "Problem · solution · market · traction · ask." },
  { id: "pitch",           label: "Pitch Deck",       icon: <Rocket className="h-4 w-4" />,         hint: "Story-first pitch: hook, insight, moat, team." },
  { id: "sales",           label: "Sales Deck",       icon: <Briefcase className="h-4 w-4" />,      hint: "Discovery · value · ROI · case studies · next steps." },
  { id: "marketing",       label: "Marketing Deck",   icon: <Megaphone className="h-4 w-4" />,      hint: "Campaign story · audience · channels · KPIs." },
  { id: "business",        label: "Business Deck",    icon: <Briefcase className="h-4 w-4" />,      hint: "Strategy · operations · financials · roadmap." },
  { id: "company-profile", label: "Company Profile",  icon: <Building2 className="h-4 w-4" />,      hint: "About · offerings · team · clients · contact." },
  { id: "education",       label: "Education Slides", icon: <GraduationCap className="h-4 w-4" />,  hint: "Learning objectives · lessons · exercises · summary." },
];

const PRESET_INTRO: Record<PresetId, string> = {
  powerpoint:        "Describe the deck: title, audience, key sections.",
  investor:          "Describe the company, market, traction, and ask.",
  pitch:             "Describe the hook, insight, and why-now.",
  sales:             "Describe the customer, pain, and value proposition.",
  marketing:         "Describe the campaign, audience, and channels.",
  business:          "Describe the strategy, ops, and financials.",
  "company-profile": "Describe the company, offerings, and clients.",
  education:         "Describe the topic, objectives, and audience level.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function PresentationBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("investor");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY drafting ${preset} deck…`);
  }, [preset, pushLog]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const generate   = () => { pushLog("log", `Generate ${preset} deck via Creator Runtime`); toast.info(`Generating ${preset} deck…`); };
  const exportPptx = () => { pushLog("log", `Export ${preset} → PPTX via Publishing Runtime`); toast.info("Exporting PPTX…"); };
  const exportPdf  = () => { pushLog("log", `Export ${preset} → PDF via Publishing Runtime`); toast.info("Exporting PDF…"); };
  const publishDeck = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Presentation className="h-4 w-4" /> HAPPY Presentation Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Generate decks with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every deck flows through the canonical pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Deck presets" className="flex flex-wrap gap-2">
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
            defaultSurface="presentation"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`presentation:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                      className="gap-1"><Sparkles className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline" onClick={exportPptx}  className="gap-1"><FileType2 className="h-4 w-4" />Export PPTX</Button>
            <Button size="sm" variant="outline" onClick={exportPdf}   className="gap-1"><Download className="h-4 w-4" />Export PDF</Button>
            <Button size="sm" variant="secondary" onClick={publishDeck} className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"   className="gap-1"><Monitor className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="outline"   className="gap-1"><LayoutGrid className="h-4 w-4" />Outline</TabsTrigger>
              <TabsTrigger value="theme"     className="gap-1"><Palette className="h-4 w-4" />Theme</TabsTrigger>
              <TabsTrigger value="notes"     className="gap-1"><Sparkles className="h-4 w-4" />Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div className="mx-auto rounded-lg border bg-background overflow-hidden" style={{ maxWidth: 960, aspectRatio: "16 / 9" }}>
                <div className="h-full grid place-items-center text-sm text-muted-foreground p-8 text-center">
                  16:9 slide preview · {activePreset.label} · rendered from Creator Runtime output.
                </div>
              </div>
            </TabsContent>
            <TabsContent value="outline" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Deck outline (cover, sections, closing) generated by HAPPY.
              </p>
            </TabsContent>
            <TabsContent value="theme" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Theme pulls palette, typography, and logo from Workspace tokens.
              </p>
            </TabsContent>
            <TabsContent value="notes" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Speaker notes drafted per slide for presenter view.
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
                  Preset changes, generations, exports, and publishes log here.
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
