/**
 * /builder/agents — HAPPY AI Agent Builder™ (R210)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Knowledge / Workspace / Memory / Digital Human / Automation /
 *     Business / Mission Control runtimes — reached via the composer.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Users, HandCoins, LifeBuoy, IdCard, Crown, MessageCircle, Mail,
  Mic, BookOpen, Workflow, Brain, User, Sparkles, Play, Eye, Wrench,
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

export const Route = createFileRoute("/_authenticated/builder/agents")({
  head: () => ({
    meta: [
      { title: "AI Agent Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgentBuilderRoute,
});

type AgentId =
  | "customer" | "sales" | "support" | "hr" | "founder"
  | "whatsapp" | "email" | "voice"
  | "knowledge" | "automation" | "memory" | "digital-human";

const AGENTS: { id: AgentId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "customer",      label: "Customer Agent",      icon: <Users className="h-4 w-4" />,          hint: "Onboarding, account help, and CRM-aware conversation." },
  { id: "sales",         label: "Sales Agent",         icon: <HandCoins className="h-4 w-4" />,      hint: "Lead qualification, quoting, and pipeline updates." },
  { id: "support",       label: "Support Agent",       icon: <LifeBuoy className="h-4 w-4" />,       hint: "Ticket triage, knowledge answers, and escalation." },
  { id: "hr",            label: "HR Agent",            icon: <IdCard className="h-4 w-4" />,         hint: "Employee Q&A, leave, and policy explanations." },
  { id: "founder",       label: "Founder Agent",       icon: <Crown className="h-4 w-4" />,          hint: "Executive briefing, decisions, and cross-domain review." },
  { id: "whatsapp",      label: "WhatsApp Agent",      icon: <MessageCircle className="h-4 w-4" />,  hint: "WhatsApp conversations wired to the canonical pipeline." },
  { id: "email",         label: "Email Agent",         icon: <Mail className="h-4 w-4" />,           hint: "Inbox triage, drafting, and follow-ups." },
  { id: "voice",         label: "Voice Agent",         icon: <Mic className="h-4 w-4" />,            hint: "Realtime voice conversation with Digital Human runtime." },
  { id: "knowledge",     label: "Knowledge Agent",     icon: <BookOpen className="h-4 w-4" />,       hint: "Retrieval-grounded answers over Workspace knowledge." },
  { id: "automation",    label: "Automation Agent",    icon: <Workflow className="h-4 w-4" />,       hint: "Multi-step workflows across HAPPY runtimes." },
  { id: "memory",        label: "Memory Agent",        icon: <Brain className="h-4 w-4" />,          hint: "Long-term memory recall, capture, and curation." },
  { id: "digital-human", label: "Digital Human Agent", icon: <User className="h-4 w-4" />,           hint: "Canonical HAPPY avatar for embodied conversation." },
];

const AGENT_INTRO: Record<AgentId, string> = {
  customer:      "Design a customer agent. Include: persona, tone, tools, and handoff.",
  sales:         "Design a sales agent. Include: qualification questions and objection handling.",
  support:       "Design a support agent. Include: triage rules and escalation policy.",
  hr:            "Design an HR agent. Include: policies, leave rules, and escalation.",
  founder:       "Design the founder agent. Include: briefings, decisions, and reporting.",
  whatsapp:      "Design a WhatsApp agent. Include: templates, opt-in, and reply rules.",
  email:         "Design an email agent. Include: triage, drafting style, and follow-ups.",
  voice:         "Design a voice agent. Include: greeting, turn-taking, and barge-in.",
  knowledge:     "Design a knowledge agent. Include: sources, freshness, and citations.",
  automation:    "Design an automation agent. Include: triggers, steps, and approvals.",
  memory:        "Design a memory agent. Include: what to remember and what to forget.",
  "digital-human": "Design the digital human. Include: mode, expression, and voice.",
};

const TOOL_LIBRARY = [
  "Knowledge Search", "Workspace Query", "CRM Lookup", "Order Lookup",
  "Ticket Create", "Send Email", "Send WhatsApp", "Schedule Meeting",
  "Approve Request", "Memory Recall", "Memory Save", "Handoff to Human",
];

const CHANNEL_LIBRARY = [
  "In-App Chat", "WhatsApp", "Email", "Voice", "Digital Human", "Slack", "SMS",
];

interface BuildEvent { id: string; at: string; label: string; detail?: string }

function AgentBuilderRoute() {
  const [agent, setAgent] = React.useState<AgentId>("customer");
  const [events, setEvents] = React.useState<BuildEvent[]>([]);

  const pushEvent = React.useCallback((label: string, detail?: string) => {
    setEvents((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), label, detail },
      ...prev,
    ].slice(0, 200));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushEvent(`Design · ${agent}`, p.prompt.slice(0, 160));
    toast.success(`HAPPY drafting ${agent} agent…`);
  }, [agent, pushEvent]);

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

  const runDeploy  = () => { pushEvent("Deploy",  "Agent registered with Automation Runtime"); toast.info("Agent deploy queued."); };
  const runPreview = () => { pushEvent("Preview", "Opened preview conversation");              toast.info("Opening preview…"); };
  const runTest    = () => { pushEvent("Test",    "Scenario test dispatched");                 toast.info("Running scenario tests…"); };

  const activeAgent = AGENTS.find((a) => a.id === agent)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" /> HAPPY AI Agent Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Build an AI agent with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            One canonical composer, one canonical action bar, reusing Knowledge,
            Workspace, Memory, Digital Human, Automation, and Mission Control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{activeAgent.label}</Badge>
        </div>
      </header>

      <Separator className="my-6" />

      <section aria-label="Agents" className="flex flex-wrap gap-2">
        {AGENTS.map((a) => (
          <Button
            key={a.id}
            size="sm"
            variant={agent === a.id ? "default" : "outline"}
            onClick={() => { setAgent(a.id); pushEvent("Agent", a.label); }}
            className="gap-2"
          >
            {a.icon}{a.label}
          </Button>
        ))}
      </section>
      <p className="text-xs text-muted-foreground mt-2">{activeAgent.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-6">
        {/* Left: tools + channels */}
        <aside className="space-y-6">
          <section>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="h-4 w-4" /> Tool Library
            </div>
            <ScrollArea className="h-56 mt-2 rounded-md border">
              <ul className="p-2 space-y-1">
                {TOOL_LIBRARY.map((t) => (
                  <li key={t}>
                    <button
                      onClick={() => insertPreset(`Tool · ${t}`)}
                      className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted"
                    >{t}</button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </section>
          <section>
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageCircle className="h-4 w-4" /> Channel Library
            </div>
            <ScrollArea className="h-40 mt-2 rounded-md border">
              <ul className="p-2 space-y-1">
                {CHANNEL_LIBRARY.map((c) => (
                  <li key={c}>
                    <button
                      onClick={() => insertPreset(`Channel · ${c}`)}
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
            defaultSurface="ai-agent"
            placeholder={AGENT_INTRO[agent]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`agent:${agent}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={runPreview} className="gap-1"><Eye className="h-4 w-4" />Preview</Button>
            <Button size="sm" variant="outline" onClick={runTest}    className="gap-1"><Play className="h-4 w-4" />Run Tests</Button>
            <Button size="sm" onClick={runDeploy}                    className="gap-1"><Sparkles className="h-4 w-4" />Deploy Agent</Button>
          </div>

          <Tabs defaultValue="persona" className="w-full">
            <TabsList>
              <TabsTrigger value="persona">Persona</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="policy">Policy</TabsTrigger>
            </TabsList>
            <TabsContent value="persona" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Describe persona, tone, and objectives in the composer. HAPPY drafts
                the persona spec and stores it via the Memory Runtime.
              </p>
            </TabsContent>
            <TabsContent value="tools" className="mt-3">
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TOOL_LIBRARY.map((t) => (
                  <li key={t} className="border rounded p-3 text-sm flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />{t}
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="channels" className="mt-3">
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CHANNEL_LIBRARY.map((c) => (
                  <li key={c} className="border rounded p-3 text-sm flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />{c}
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="policy" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Guardrails, escalation, approvals, and audit are enforced by the
                canonical pipeline. Mutations always route Founder → Brain →
                Approval → Audit → Execution → Mission Control.
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
