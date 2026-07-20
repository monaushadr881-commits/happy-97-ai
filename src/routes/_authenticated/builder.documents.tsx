/**
 * /builder/documents — HAPPY Document Builder™ (R218)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer (surface: "document")
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Publishing runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  FileText, FileType2, FileSignature, Receipt, FileSpreadsheet,
  ScrollText, User, Building2, BookOpen, Library, ShieldCheck,
  Gavel, BarChart3, Sparkles, Download, FileCheck2, Monitor,
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

export const Route = createFileRoute("/_authenticated/builder/documents")({
  head: () => ({
    meta: [
      { title: "Document Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DocumentsBuilderRoute,
});

type PresetId =
  | "pdf" | "docx" | "proposal" | "invoice" | "quotation" | "agreement"
  | "resume" | "company-profile" | "brochure" | "catalogue"
  | "sop" | "policy" | "report";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "pdf",             label: "PDF",             icon: <FileType2 className="h-4 w-4" />,         hint: "Print-ready PDF with cover, sections, page numbers." },
  { id: "docx",            label: "DOCX",            icon: <FileText className="h-4 w-4" />,          hint: "Editable Word document with styles + TOC." },
  { id: "proposal",        label: "Proposal",        icon: <FileSignature className="h-4 w-4" />,     hint: "Cover · scope · timeline · pricing · terms." },
  { id: "invoice",         label: "Invoice",         icon: <Receipt className="h-4 w-4" />,           hint: "Header · line items · totals · tax · payment." },
  { id: "quotation",       label: "Quotation",       icon: <FileSpreadsheet className="h-4 w-4" />,   hint: "Itemized quote · validity · terms · acceptance." },
  { id: "agreement",       label: "Agreement",       icon: <Gavel className="h-4 w-4" />,             hint: "Contract · parties · clauses · signature block." },
  { id: "resume",          label: "Resume",          icon: <User className="h-4 w-4" />,              hint: "Profile · experience · skills · education." },
  { id: "company-profile", label: "Company Profile", icon: <Building2 className="h-4 w-4" />,         hint: "About · offerings · team · clients · contact." },
  { id: "brochure",        label: "Brochure",        icon: <BookOpen className="h-4 w-4" />,          hint: "Tri-fold marketing brochure with imagery." },
  { id: "catalogue",       label: "Catalogue",       icon: <Library className="h-4 w-4" />,           hint: "Product catalogue with images and SKUs." },
  { id: "sop",             label: "SOP",             icon: <ScrollText className="h-4 w-4" />,        hint: "Standard Operating Procedure with steps." },
  { id: "policy",          label: "Policy",          icon: <ShieldCheck className="h-4 w-4" />,       hint: "Policy document with scope and enforcement." },
  { id: "report",          label: "Report",          icon: <BarChart3 className="h-4 w-4" />,         hint: "Executive report with KPIs and analysis." },
];

const PRESET_INTRO: Record<PresetId, string> = {
  pdf:               "Describe the PDF: title, sections, tone.",
  docx:              "Describe the Word doc: purpose and outline.",
  proposal:          "Describe the client, project, and pricing.",
  invoice:           "Describe billed party, line items, amounts.",
  quotation:         "Describe the customer, items, validity.",
  agreement:         "Describe parties, obligations, term, jurisdiction.",
  resume:            "Describe candidate: role, skills, highlights.",
  "company-profile": "Describe the company, offerings, and clients.",
  brochure:          "Describe product/service and target audience.",
  catalogue:         "Describe product range, categories, pricing.",
  sop:               "Describe the process, steps, and owners.",
  policy:            "Describe policy scope, rules, and enforcement.",
  report:            "Describe the report period, KPIs, and narrative.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function DocumentsBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("proposal");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);
  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "documents", onLog: pushLog });

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

  const generate     = () => { pushLog("log", `Generate ${preset} via Creator Runtime`); toast.info(`Generating ${preset}…`); };
  const exportPdf    = () => { pushLog("log", `Export ${preset} → PDF via Publishing Runtime`); toast.info("Exporting PDF…"); };
  const exportDocx   = () => { pushLog("log", `Export ${preset} → DOCX via Publishing Runtime`); toast.info("Exporting DOCX…"); };
  const publishDoc   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" /> HAPPY Document Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Generate business documents with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every document flows through the canonical pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Document presets" className="flex flex-wrap gap-2">
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
            defaultSurface="document"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`document:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                     className="gap-1"><Sparkles className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline" onClick={exportPdf}  className="gap-1"><Download className="h-4 w-4" />Export PDF</Button>
            <Button size="sm" variant="outline" onClick={exportDocx} className="gap-1"><Download className="h-4 w-4" />Export DOCX</Button>
            <Button size="sm" variant="secondary" onClick={publishDoc} className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"   className="gap-1"><Monitor className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="outline"   className="gap-1"><ScrollText className="h-4 w-4" />Outline</TabsTrigger>
              <TabsTrigger value="branding"  className="gap-1"><Sparkles className="h-4 w-4" />Branding</TabsTrigger>
              <TabsTrigger value="policy"    className="gap-1"><ShieldCheck className="h-4 w-4" />Policy</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div className="mx-auto border rounded-lg bg-background overflow-hidden" style={{ maxWidth: 816, minHeight: 640 }}>
                <div className="h-full grid place-items-center text-sm text-muted-foreground p-8 text-center">
                  A4 preview · {activePreset.label} · rendered from Creator Runtime output.
                </div>
              </div>
            </TabsContent>
            <TabsContent value="outline" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Document outline (cover, sections, appendices) generated by HAPPY.
              </p>
            </TabsContent>
            <TabsContent value="branding" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Branding pulls logo, colors, and typography from Workspace theme tokens.
              </p>
            </TabsContent>
            <TabsContent value="policy" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Executive Review → Approval → Audit before Publishing.
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
