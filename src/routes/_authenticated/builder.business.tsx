/**
 * /builder/business — HAPPY Business App Generator™ (R224)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer (surface: "business-app")
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Business / Creator / Publishing runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Briefcase, Users, Building2, UserCog, ShoppingCart, Boxes,
  Warehouse, Factory, BookOpen, Wallet, Banknote, Megaphone,
  Headphones, FolderKanban, HardHat, Scale, ShieldCheck as ComplianceIcon,
  FileSearch, BarChart3, Brain, Sparkles, Rocket, Download,
  LayoutDashboard, Database, ShieldCheck,
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

export const Route = createFileRoute("/_authenticated/builder/business")({
  head: () => ({
    meta: [
      { title: "Business App Generator — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BusinessAppBuilderRoute,
});

type PresetId =
  | "crm" | "erp" | "hrms" | "accounting" | "finance" | "payroll"
  | "manufacturing" | "inventory" | "warehouse" | "procurement"
  | "sales" | "marketing" | "support" | "projects" | "assets"
  | "legal" | "compliance" | "audit" | "analytics" | "ai";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "crm",           label: "CRM",           icon: <Users className="h-4 w-4" />,           hint: "Leads · Deals · Contacts · Pipelines · Activities." },
  { id: "erp",           label: "ERP",           icon: <Building2 className="h-4 w-4" />,       hint: "Finance · Procurement · Inventory · Sales · Reporting." },
  { id: "hrms",          label: "HRMS",          icon: <UserCog className="h-4 w-4" />,         hint: "Employees · Attendance · Leave · Performance · Docs." },
  { id: "accounting",    label: "Accounting",    icon: <BookOpen className="h-4 w-4" />,        hint: "Chart of accounts · Journals · Ledgers · Reports." },
  { id: "finance",       label: "Finance",       icon: <Wallet className="h-4 w-4" />,          hint: "Budgets · Forecasts · Cash flow · Treasury." },
  { id: "payroll",       label: "Payroll",       icon: <Banknote className="h-4 w-4" />,        hint: "Salaries · Taxes · Payslips · Statutory filings." },
  { id: "manufacturing", label: "Manufacturing", icon: <Factory className="h-4 w-4" />,         hint: "BOM · Work orders · Machines · Quality · Downtime." },
  { id: "inventory",     label: "Inventory",     icon: <Boxes className="h-4 w-4" />,           hint: "Items · Stock · Reservations · Cycle counts · Alerts." },
  { id: "warehouse",     label: "Warehouse",     icon: <Warehouse className="h-4 w-4" />,       hint: "Zones · Bins · Receiving · Picking · Transfers." },
  { id: "procurement",   label: "Procurement",   icon: <ShoppingCart className="h-4 w-4" />,    hint: "Requisitions · POs · Vendors · Contracts · GRN." },
  { id: "sales",         label: "Sales",         icon: <BarChart3 className="h-4 w-4" />,       hint: "Quotes · Orders · Invoices · Commissions · Targets." },
  { id: "marketing",     label: "Marketing",     icon: <Megaphone className="h-4 w-4" />,       hint: "Campaigns · Segments · Content · Analytics · ROI." },
  { id: "support",       label: "Support",       icon: <Headphones className="h-4 w-4" />,      hint: "Tickets · SLAs · Knowledge base · CSAT · Escalations." },
  { id: "projects",      label: "Projects",      icon: <FolderKanban className="h-4 w-4" />,    hint: "Tasks · Milestones · Timesheets · Resources · Gantt." },
  { id: "assets",        label: "Assets",        icon: <HardHat className="h-4 w-4" />,         hint: "Asset register · Depreciation · Maintenance · Audits." },
  { id: "legal",         label: "Legal",         icon: <Scale className="h-4 w-4" />,           hint: "Contracts · Matters · Signatures · Renewals · Vault." },
  { id: "compliance",    label: "Compliance",    icon: <ComplianceIcon className="h-4 w-4" />,  hint: "Policies · Controls · Evidence · Regulatory filings." },
  { id: "audit",         label: "Audit",         icon: <FileSearch className="h-4 w-4" />,      hint: "Plans · Findings · Remediation · Immutable audit logs." },
  { id: "analytics",     label: "Analytics",     icon: <BarChart3 className="h-4 w-4" />,       hint: "KPIs · Dashboards · Forecasts · Insights · Alerts." },
  { id: "ai",            label: "AI Integration",icon: <Brain className="h-4 w-4" />,           hint: "Copilots · Agents · Automations · Memory · Knowledge." },
];

const PRESET_INTRO: Record<PresetId, string> = {
  crm:           "Describe the pipeline, teams, and lead sources.",
  erp:           "Describe modules, currencies, and org units.",
  hrms:          "Describe headcount, policies, and org structure.",
  accounting:    "Describe chart of accounts, tax rules, and fiscal calendar.",
  finance:       "Describe budgets, forecast horizons, and cash flow rules.",
  payroll:       "Describe pay cycles, statutory deductions, and payslips.",
  manufacturing: "Describe products, BOM, and workstations.",
  inventory:     "Describe items, warehouses, and reorder rules.",
  warehouse:     "Describe zones, bins, and picking strategy.",
  procurement:   "Describe vendors, approval matrix, and PO workflow.",
  sales:         "Describe pipelines, price lists, and commission plans.",
  marketing:     "Describe channels, segments, and campaign KPIs.",
  support:       "Describe queues, SLAs, and escalation rules.",
  projects:      "Describe project types, tasks, and billing model.",
  assets:        "Describe asset classes, depreciation, and maintenance.",
  legal:         "Describe contract types, approval matrix, and vault.",
  compliance:    "Describe frameworks, controls, and evidence sources.",
  audit:         "Describe audit universe, plan, and finding workflow.",
  analytics:     "Describe KPIs, dashboards, and forecast horizons.",
  ai:            "Describe copilots, agents, memory, and automations.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function BusinessAppBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("crm");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);
  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "business", onLog: pushLog });

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

  const scaffold = () => { pushLog("log", `Scaffold ${preset} via Business Runtime`); toast.info(`Scaffolding ${preset}…`); };
  const seed     = () => { pushLog("log", `Seed demo data for ${preset}`); toast.info("Seeding demo data…"); };
  const exportZ  = () => { pushLog("log", `Export ${preset} → ZIP via Publishing Runtime`); toast.info("Exporting ZIP…"); };
  const deploy   = () => { pushLog("log", `Deploy ${preset} → Approval → Audit → Mission Control`); toast.info("Deploying…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4" /> HAPPY Business App Generator
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Generate complete business apps with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every app flows through the canonical pipeline —
            Business → Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Business presets" className="flex flex-wrap gap-2">
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
            defaultSurface="fullstack-app"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`business:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={scaffold}                       className="gap-1"><Sparkles className="h-4 w-4" />Scaffold</Button>
            <Button size="sm" variant="outline"   onClick={seed}       className="gap-1"><Database className="h-4 w-4" />Seed Demo</Button>
            <Button size="sm" variant="outline"   onClick={exportZ}    className="gap-1"><Download className="h-4 w-4" />Export ZIP</Button>
            <Button size="sm" variant="secondary" onClick={deploy}     className="gap-1"><Rocket className="h-4 w-4" />Deploy</Button>
          </div>

          <Tabs defaultValue="modules" className="w-full">
            <TabsList>
              <TabsTrigger value="modules"   className="gap-1"><LayoutDashboard className="h-4 w-4" />Modules</TabsTrigger>
              <TabsTrigger value="schema"    className="gap-1"><Database className="h-4 w-4" />Schema</TabsTrigger>
              <TabsTrigger value="roles"     className="gap-1"><ShieldCheck className="h-4 w-4" />Roles & RLS</TabsTrigger>
              <TabsTrigger value="deploy"    className="gap-1"><Rocket className="h-4 w-4" />Deploy</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Modules for <strong>{activePreset.label}</strong> generated by the Business Runtime — reuses existing canonical tables where present.
              </p>
            </TabsContent>
            <TabsContent value="schema" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Tables, relations, indexes, and migrations proposed by HAPPY · reviewed before apply.
              </p>
            </TabsContent>
            <TabsContent value="roles" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Roles, permissions, and RLS policies proposed for every generated table.
              </p>
            </TabsContent>
            <TabsContent value="deploy" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Deployment targets and rollout plan · delegated to Publishing Runtime.
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
                  Preset changes, scaffolds, seeds, exports, and deploys log here.
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
