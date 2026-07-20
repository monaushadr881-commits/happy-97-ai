/**
 * /founder/admin — HAPPY Enterprise Admin™ (R234)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Founder / Enterprise / Publishing / Mission Control via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Building2, Building, Users, UsersRound, User, KeyRound, ShieldCheck,
  ClipboardList, ScrollText, Archive, RotateCcw, Receipt, CreditCard,
  Sparkles, Play, Download, FileCheck2,
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

export const Route = createFileRoute("/_authenticated/founder/admin")({
  head: () => ({
    meta: [
      { title: "Enterprise Admin — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EnterpriseAdminRoute,
});

type PresetId =
  | "organizations" | "companies" | "teams" | "departments" | "users"
  | "permissions" | "roles" | "audit" | "logs" | "backups"
  | "restore" | "licenses" | "subscriptions";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "organizations", label: "Organizations", icon: <Building2 className="h-4 w-4" />,      hint: "Top-level orgs · brands · legal entities." },
  { id: "companies",     label: "Companies",     icon: <Building className="h-4 w-4" />,       hint: "Companies · business units · offices." },
  { id: "teams",         label: "Teams",         icon: <UsersRound className="h-4 w-4" />,     hint: "Teams · cross-functional groups · owners." },
  { id: "departments",   label: "Departments",   icon: <Users className="h-4 w-4" />,          hint: "Departments · managers · headcount." },
  { id: "users",         label: "Users",         icon: <User className="h-4 w-4" />,           hint: "Employees · founders · guests · SSO identity." },
  { id: "permissions",   label: "Permissions",   icon: <KeyRound className="h-4 w-4" />,       hint: "Fine-grained permissions · scopes · policies." },
  { id: "roles",         label: "Roles",         icon: <ShieldCheck className="h-4 w-4" />,    hint: "Roles · assignments · founder / admin / member." },
  { id: "audit",         label: "Audit",         icon: <ClipboardList className="h-4 w-4" />,  hint: "Immutable audit trail across every domain." },
  { id: "logs",          label: "Logs",          icon: <ScrollText className="h-4 w-4" />,     hint: "System / access / security logs · filters." },
  { id: "backups",       label: "Backups",       icon: <Archive className="h-4 w-4" />,        hint: "Backup jobs · policies · artifacts · retention." },
  { id: "restore",       label: "Restore",       icon: <RotateCcw className="h-4 w-4" />,      hint: "Restore drills · recovery plans · RPO / RTO." },
  { id: "licenses",      label: "Licenses",      icon: <Receipt className="h-4 w-4" />,        hint: "License keys · seats · entitlements · usage." },
  { id: "subscriptions", label: "Subscriptions", icon: <CreditCard className="h-4 w-4" />,     hint: "Plans · billing cycles · dunning · events." },
];

const INTRO: Record<PresetId, string> = {
  organizations: "Ask about organizations · brands · legal entities.",
  companies:     "Ask about companies · business units · offices.",
  teams:         "Ask about teams · owners · cross-functional groups.",
  departments:   "Ask about departments · managers · headcount.",
  users:         "Ask about users · identities · SSO · invitations.",
  permissions:   "Ask about permissions · scopes · policies.",
  roles:         "Ask about roles · assignments · grants.",
  audit:         "Ask about audit trail across any domain.",
  logs:          "Ask about system / access / security logs.",
  backups:       "Ask about backup jobs · policies · artifacts.",
  restore:       "Ask about restore drills · recovery plans · RPO / RTO.",
  licenses:      "Ask about license keys · seats · entitlements.",
  subscriptions: "Ask about plans · billing cycles · dunning.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function EnterpriseAdminRoute() {
  const [preset, setPreset] = React.useState<PresetId>("organizations");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY administering ${preset}…`);
  }, [preset, pushLog]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const run       = () => { pushLog("log", `Run ${preset} via Enterprise Runtime`);              toast.info(`Running ${preset}…`); };
  const suggest   = () => { pushLog("log", `AI suggest · ${preset} via Founder Runtime`);        toast.info("HAPPY generating suggestion…"); };
  const exportCsv = () => { pushLog("log", `Export ${preset} → CSV via Publishing Runtime`);     toast.info("Exporting…"); };
  const publish   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" /> HAPPY Enterprise Admin
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Govern orgs, users, roles, audit, backups & subscriptions
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every action flows through the canonical pipeline —
            Enterprise → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Admin presets" className="flex flex-wrap gap-2">
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
            target={`admin:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={run}                          className="gap-1"><Play className="h-4 w-4" />Run</Button>
            <Button size="sm" variant="outline"   onClick={suggest}  className="gap-1"><Sparkles className="h-4 w-4" />AI Suggest</Button>
            <Button size="sm" variant="outline"   onClick={exportCsv}className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}  className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview" className="gap-1"><Building2 className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="records"  className="gap-1"><Users className="h-4 w-4" />Records</TabsTrigger>
              <TabsTrigger value="policies" className="gap-1"><ShieldCheck className="h-4 w-4" />Policies</TabsTrigger>
              <TabsTrigger value="audit"    className="gap-1"><ClipboardList className="h-4 w-4" />Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[280px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · summary renders here from Enterprise Runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="records"  className="mt-3"><p className="text-sm text-muted-foreground">Managed records list · filter · sort · bulk actions.</p></TabsContent>
            <TabsContent value="policies" className="mt-3"><p className="text-sm text-muted-foreground">RBAC · scopes · retention · backup / restore policies.</p></TabsContent>
            <TabsContent value="audit"    className="mt-3"><p className="text-sm text-muted-foreground">Immutable audit trail · mirrored to Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Admin Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, runs, suggestions, exports, and publishes log here.
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
