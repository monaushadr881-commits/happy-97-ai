/**
 * /erp — HAPPY ERP Builder™ (R244)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Knowledge / Publishing / Mission Control via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Boxes, Factory, Landmark, Handshake, Users, FolderKanban, ShoppingCart,
  Play, Sparkles, Download, FileCheck2, ScrollText, LayoutGrid, BarChart3,
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

export const Route = createFileRoute("/_authenticated/erp")({
  head: () => ({
    meta: [
      { title: "ERP Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ErpRoute,
});

type PresetId =
  | "inventory" | "manufacturing" | "finance" | "crm" | "hr" | "projects" | "procurement";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "inventory",     label: "Inventory",     icon: <Boxes className="h-4 w-4" />,        hint: "SKUs · warehouses · lots · transfers · cycle counts." },
  { id: "manufacturing", label: "Manufacturing", icon: <Factory className="h-4 w-4" />,      hint: "BOM · production orders · routing · QC · machines." },
  { id: "finance",       label: "Finance",       icon: <Landmark className="h-4 w-4" />,     hint: "Accounting · GST · invoices · payments · reports." },
  { id: "crm",           label: "CRM",           icon: <Handshake className="h-4 w-4" />,    hint: "Leads · deals · contacts · pipeline · activity." },
  { id: "hr",            label: "HR",            icon: <Users className="h-4 w-4" />,        hint: "Employees · attendance · leave · payroll · performance." },
  { id: "projects",      label: "Projects",      icon: <FolderKanban className="h-4 w-4" />, hint: "Plans · tasks · resources · timesheets · billing." },
  { id: "procurement",   label: "Procurement",   icon: <ShoppingCart className="h-4 w-4" />, hint: "PR · RFQ · PO · vendors · GRN · contracts." },
];

const INTRO: Record<PresetId, string> = {
  inventory:     "Describe the inventory surface · warehouses · policies.",
  manufacturing: "Describe the production plan · BOM · routing · QC.",
  finance:       "Describe the finance surface · scope · period.",
  crm:           "Describe the CRM surface · pipeline · automation.",
  hr:            "Describe the HR surface · policies · workflows.",
  projects:      "Describe the project · scope · milestones · billing.",
  procurement:   "Describe the procurement flow · PR · RFQ · PO · GRN.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function ErpRoute() {
  const [preset, setPreset] = React.useState<PresetId>("inventory");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY working on ${preset}…`);
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
            <Factory className="h-4 w-4" /> HAPPY ERP Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Ship the enterprise backbone — one system of record
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every action flows through the canonical pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="ERP presets" className="flex flex-wrap gap-2">
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
            defaultSurface="fullstack-app"
            placeholder={INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`erp:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                       className="gap-1"><Play className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline"   onClick={optimize}   className="gap-1"><Sparkles className="h-4 w-4" />AI Optimize</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt}  className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}    className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"    className="gap-1"><LayoutGrid className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="modules"    className="gap-1"><Boxes className="h-4 w-4" />Modules</TabsTrigger>
              <TabsTrigger value="operations" className="gap-1"><Factory className="h-4 w-4" />Operations</TabsTrigger>
              <TabsTrigger value="finance"    className="gap-1"><Landmark className="h-4 w-4" />Finance</TabsTrigger>
              <TabsTrigger value="analytics"  className="gap-1"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
              <TabsTrigger value="publish"    className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[280px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · surface renders here from Creator Runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="modules"    className="mt-3"><p className="text-sm text-muted-foreground">Inventory · Manufacturing · CRM · HR · Projects · Procurement.</p></TabsContent>
            <TabsContent value="operations" className="mt-3"><p className="text-sm text-muted-foreground">Orders · production · stock · dispatch · procurement flow.</p></TabsContent>
            <TabsContent value="finance"    className="mt-3"><p className="text-sm text-muted-foreground">Ledger · invoices · payments · GST · P&L · balance sheet.</p></TabsContent>
            <TabsContent value="analytics"  className="mt-3"><p className="text-sm text-muted-foreground">KPIs · variance · forecast · working capital · MIS.</p></TabsContent>
            <TabsContent value="publish"    className="mt-3"><p className="text-sm text-muted-foreground">Approval · schedule · rollout · rollback · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> ERP Log
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
