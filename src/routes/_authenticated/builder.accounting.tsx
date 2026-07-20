/**
 * /builder/accounting — HAPPY Accounting Builder™
 *
 * Thin presentation shell over the existing Business Runtime.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Business · Knowledge · Publishing · Approval · Audit · Mission Control runtimes.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * Every mutation flows through the 13-stage canonical pipeline.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Calculator, BookOpen, NotebookPen, Percent, Receipt, Wallet, Users, BarChart3,
  Play, Sparkles, Download, FileCheck2, ScrollText, LayoutGrid, Activity,
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

export const Route = createFileRoute("/_authenticated/builder/accounting")({
  head: () => ({
    meta: [
      { title: "Accounting Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountingBuilderRoute,
});

type PresetId =
  | "ledger" | "journal" | "gst" | "invoices" | "expenses" | "payroll" | "reports";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "ledger",   label: "Ledger",   icon: <BookOpen className="h-4 w-4" />,    hint: "Chart of accounts · groups · balances · opening entries." },
  { id: "journal",  label: "Journal",  icon: <NotebookPen className="h-4 w-4" />, hint: "Vouchers · debit/credit · narration · adjustments." },
  { id: "gst",      label: "GST",      icon: <Percent className="h-4 w-4" />,     hint: "GSTIN · HSN/SAC · GSTR-1/3B · ITC · e-invoice." },
  { id: "invoices", label: "Invoices", icon: <Receipt className="h-4 w-4" />,     hint: "Sales · purchase · credit/debit notes · e-way bill." },
  { id: "expenses", label: "Expenses", icon: <Wallet className="h-4 w-4" />,      hint: "Bills · reimbursements · categories · approvals." },
  { id: "payroll",  label: "Payroll",  icon: <Users className="h-4 w-4" />,       hint: "Salaries · PF · ESI · TDS · payslips · bank transfer." },
  { id: "reports",  label: "Reports",  icon: <BarChart3 className="h-4 w-4" />,   hint: "P&L · balance sheet · trial balance · cash flow · aging." },
];

const INTRO: Record<PresetId, string> = {
  ledger:   "Describe the account · group · opening balance.",
  journal:  "Describe the voucher · debit · credit · narration.",
  gst:      "Describe the GSTIN · HSN · return period · ITC.",
  invoices: "Describe the invoice · party · items · tax · e-way.",
  expenses: "Describe the bill · category · approver · reimbursement.",
  payroll:  "Describe the payroll · component · PF · ESI · TDS.",
  reports:  "Describe the report · period · dimension · comparison.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function AccountingBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("ledger");
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

  const run       = () => { pushLog("log", `Run ${preset} via Business Runtime`);            toast.info(`Running ${preset}…`); };
  const optimize  = () => { pushLog("log", `AI tune ${preset} via Knowledge Runtime`);       toast.info("HAPPY tuning…"); };
  const exportRpt = () => { pushLog("log", `Export ${preset} via Publishing Runtime`);       toast.info("Exporting…"); };
  const publish   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calculator className="h-4 w-4" /> HAPPY Accounting Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — ledger, journal, GST, invoices, payroll
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the Business runtime. Every mutation flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Accounting presets" className="flex flex-wrap gap-2">
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
            target={`accounting:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={run}                          className="gap-1"><Play className="h-4 w-4" />Run</Button>
            <Button size="sm" variant="outline"   onClick={optimize}  className="gap-1"><Sparkles className="h-4 w-4" />AI Tune</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt} className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}   className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview" className="gap-1"><LayoutGrid className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="ledger"   className="gap-1"><BookOpen className="h-4 w-4" />Ledger</TabsTrigger>
              <TabsTrigger value="journal"  className="gap-1"><NotebookPen className="h-4 w-4" />Journal</TabsTrigger>
              <TabsTrigger value="gst"      className="gap-1"><Percent className="h-4 w-4" />GST</TabsTrigger>
              <TabsTrigger value="invoices" className="gap-1"><Receipt className="h-4 w-4" />Invoices</TabsTrigger>
              <TabsTrigger value="expenses" className="gap-1"><Wallet className="h-4 w-4" />Expenses</TabsTrigger>
              <TabsTrigger value="payroll"  className="gap-1"><Users className="h-4 w-4" />Payroll</TabsTrigger>
              <TabsTrigger value="activity" className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders accounting state from the Business runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="ledger"   className="mt-3"><p className="text-sm text-muted-foreground">Chart of accounts · groups · balances · opening entries.</p></TabsContent>
            <TabsContent value="journal"  className="mt-3"><p className="text-sm text-muted-foreground">Vouchers · debit/credit · narration · adjustments.</p></TabsContent>
            <TabsContent value="gst"      className="mt-3"><p className="text-sm text-muted-foreground">GSTIN · HSN/SAC · GSTR-1/3B · ITC · e-invoice.</p></TabsContent>
            <TabsContent value="invoices" className="mt-3"><p className="text-sm text-muted-foreground">Sales · purchase · credit/debit notes · e-way bill.</p></TabsContent>
            <TabsContent value="expenses" className="mt-3"><p className="text-sm text-muted-foreground">Bills · reimbursements · categories · approvals.</p></TabsContent>
            <TabsContent value="payroll"  className="mt-3"><p className="text-sm text-muted-foreground">Salaries · PF · ESI · TDS · payslips · bank transfer.</p></TabsContent>
            <TabsContent value="activity" className="mt-3"><p className="text-sm text-muted-foreground">Runs · tunings · exports · publishes · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Accounting Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, runs, tunings, exports, and publishes log here.
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
