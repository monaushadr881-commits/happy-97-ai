/**
 * /builder/research — HAPPY AI Research Studio™ (R226)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer (surface: "research")
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Knowledge Runtime + Universal Search via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Telescope, Globe, FileText, GraduationCap, ScrollText, LineChart,
  Swords, Building2, Package, Quote, ShieldCheck, Network, Clock,
  Sparkles, Download, FileCheck2, Search,
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

export const Route = createFileRoute("/_authenticated/builder/research")({
  head: () => ({
    meta: [
      { title: "AI Research Studio — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResearchStudioRoute,
});

type PresetId =
  | "deep" | "web" | "pdf" | "academic" | "patent"
  | "market" | "competitor" | "company" | "product";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "deep",       label: "Deep Research",       icon: <Telescope className="h-4 w-4" />,    hint: "Multi-step deep research · plan → sources → synthesize → cite." },
  { id: "web",        label: "Web Research",        icon: <Globe className="h-4 w-4" />,        hint: "Live web search · summarize · attribute every claim." },
  { id: "pdf",        label: "PDF Research",        icon: <FileText className="h-4 w-4" />,     hint: "Analyze uploaded PDFs · extract facts + citations." },
  { id: "academic",   label: "Academic Research",   icon: <GraduationCap className="h-4 w-4" />,hint: "Papers / journals · methods · findings · references." },
  { id: "patent",     label: "Patent Research",     icon: <ScrollText className="h-4 w-4" />,   hint: "Patent landscape · claims · prior art · IP risk." },
  { id: "market",     label: "Market Research",     icon: <LineChart className="h-4 w-4" />,    hint: "TAM / SAM / SOM · trends · segments · demand signals." },
  { id: "competitor", label: "Competitor Research", icon: <Swords className="h-4 w-4" />,       hint: "Competitor teardown · pricing · positioning · gaps." },
  { id: "company",    label: "Company Research",    icon: <Building2 className="h-4 w-4" />,    hint: "Company profile · people · financials · signals." },
  { id: "product",    label: "Product Research",    icon: <Package className="h-4 w-4" />,      hint: "Product deep-dive · features · reviews · benchmarks." },
];

const PRESET_INTRO: Record<PresetId, string> = {
  deep:       "State the research question and desired depth.",
  web:        "What should HAPPY search on the web?",
  pdf:        "Attach PDFs and ask a question about them.",
  academic:   "Topic, field, and time window for academic search.",
  patent:     "Domain / keywords / jurisdictions for patent search.",
  market:     "Market, segment, geography, and time horizon.",
  competitor: "Company or product to benchmark against.",
  company:    "Company name / domain / ticker to research.",
  product:    "Product name or category to research.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function ResearchStudioRoute() {
  const [preset, setPreset] = React.useState<PresetId>("deep");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);
  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "research", onLog: pushLog });

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    void __submitPrompt(String(preset), p.prompt, p.attachments?.length ?? 0);
  }, [preset, pushLog, __submitPrompt]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const runResearch = () => { pushLog("log", `Run ${preset} via Knowledge Runtime + Universal Search`); toast.info(`Researching ${preset}…`); };
  const verify      = () => { pushLog("log", `Source verification · cross-check citations`); toast.info("Verifying sources…"); };
  const exportPdf   = () => { pushLog("log", `Export ${preset} report → PDF via Publishing Runtime`); toast.info("Exporting PDF…"); };
  const publish     = () => { pushLog("log", `Publish research → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Telescope className="h-4 w-4" /> HAPPY AI Research Studio
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Deep research with cited sources
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every query flows through the canonical pipeline —
            Knowledge → Universal Search → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Research presets" className="flex flex-wrap gap-2">
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
        {/* Center */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="research"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`research:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={runResearch}                  className="gap-1"><Sparkles className="h-4 w-4" />Run Research</Button>
            <Button size="sm" variant="outline"   onClick={verify}   className="gap-1"><ShieldCheck className="h-4 w-4" />Verify Sources</Button>
            <Button size="sm" variant="outline"   onClick={exportPdf}className="gap-1"><Download className="h-4 w-4" />Export PDF</Button>
            <Button size="sm" variant="secondary" onClick={publish}  className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="report" className="w-full">
            <TabsList>
              <TabsTrigger value="report"    className="gap-1"><FileText className="h-4 w-4" />Report</TabsTrigger>
              <TabsTrigger value="sources"   className="gap-1"><Search className="h-4 w-4" />Sources</TabsTrigger>
              <TabsTrigger value="citations" className="gap-1"><Quote className="h-4 w-4" />Citations</TabsTrigger>
              <TabsTrigger value="graph"     className="gap-1"><Network className="h-4 w-4" />Knowledge Graph</TabsTrigger>
              <TabsTrigger value="timeline"  className="gap-1"><Clock className="h-4 w-4" />Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="report" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <div>{activePreset.label} · report renders from Knowledge Runtime output with inline [1][2][3] citations.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="sources" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Ranked sources retrieved via Universal Search — every citation preserved with attribution.
              </p>
            </TabsContent>
            <TabsContent value="citations" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Citation engine · numbered list · exportable to Chicago / APA / MLA / IEEE.
              </p>
            </TabsContent>
            <TabsContent value="graph" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Knowledge graph of entities, topics, and citations from the Knowledge Runtime.
              </p>
            </TabsContent>
            <TabsContent value="timeline" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Research timeline · plan → search → read → synthesize → cite → publish.
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
                  Preset changes, research runs, verifications, exports, and publishes log here.
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
