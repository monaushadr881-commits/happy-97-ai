/**
 * /governance — R301 HAPPY AGENT GOVERNANCE & AUTONOMY GATE
 *
 * Founder console over `src/lib/happy-governance/*`. Read + control only —
 * every decision is made server-side by `canExecute()`. No second runtime,
 * approval engine or audit log.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ShieldAlert, ShieldCheck, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HappyUniversalPromptBar } from "@/components/happy/HappyUniversalPromptBar";
import {
  getCapabilityMatrix,
  getGovernanceOverview,
  previewAutonomyGate,
  setKillSwitch,
} from "@/lib/happy-governance/governance.functions";

export const Route = createFileRoute("/_authenticated/governance")({
  head: () => ({
    meta: [
      { title: "HAPPY Agent Governance — autonomy gate & kill switch" },
      {
        name: "description",
        content:
          "Inspect the HAPPY autonomy gate: agent capability grants, action risk classes, spending limits, runaway protection and the Founder kill switch.",
      },
      { property: "og:title", content: "HAPPY Agent Governance" },
      {
        property: "og:description",
        content: "Permission → tool restriction → risk class → budget → approval → kill switch, in one Founder console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GovernancePage,
});

type Overview = Awaited<ReturnType<typeof getGovernanceOverview>>;
type Matrix = Awaited<ReturnType<typeof getCapabilityMatrix>>;
type Preview = Awaited<ReturnType<typeof previewAutonomyGate>>;

function GovernancePage() {
  const loadOverview = useServerFn(getGovernanceOverview);
  const loadMatrix = useServerFn(getCapabilityMatrix);
  const runPreview = useServerFn(previewAutonomyGate);
  const runKill = useServerFn(setKillSwitch);

  const [busy, setBusy] = React.useState(false);
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [matrix, setMatrix] = React.useState<Matrix>([]);
  const [preview, setPreview] = React.useState<Preview | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const [o, m] = await Promise.all([loadOverview({}), loadMatrix({})]);
      setOverview(o);
      setMatrix(m);
    } catch {
      /* best effort */
    }
  }, [loadOverview, loadMatrix]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const simulate = React.useCallback(
    async (payload: { prompt: string }) => {
      const task = payload.prompt.trim();
      if (!task) {
        toast.error("Describe the action to evaluate.");
        return;
      }
      setBusy(true);
      try {
        const p = await runPreview({ data: { task } });
        setPreview(p);
        toast[p.decision.allowed ? "success" : "warning"](p.decision.explanation);
      } catch (e) {
        toast.error(`Could not evaluate · ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [runPreview],
  );

  const kill = React.useCallback(
    async (engage: boolean) => {
      setBusy(true);
      try {
        const res = await runKill({ data: { level: "global", engage, reason: "Founder console" } });
        toast[res.ok ? "success" : "error"](res.message);
        await refresh();
      } catch {
        toast.error("Founder permission required.");
      } finally {
        setBusy(false);
      }
    },
    [runKill, refresh],
  );

  const ks = overview?.killSwitch;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">HAPPY Agent Governance</h1>
        <p className="text-sm text-muted-foreground">
          Authenticate → Authorize → Scope → Tool → Resource → Kill switch → Runaway → Budget → Approval → Execution.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <Badge variant="outline">Gate {overview?.gateVersion ?? "—"}</Badge>
        <Badge variant={overview?.isFounder ? "secondary" : "outline"}>
          {overview?.isFounder ? "Founder" : "Standard actor"}
        </Badge>
        {ks ? (
          <Badge variant={ks.globalStopped || ks.unavailable ? "destructive" : "secondary"} className="gap-1">
            {ks.globalStopped || ks.unavailable ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
            {ks.unavailable ? "state unreadable — fail closed" : ks.globalStopped ? "GLOBAL STOP engaged" : "gate live"}
          </Badge>
        ) : null}
        <Badge variant={overview?.usage.unavailable ? "destructive" : "outline"}>
          {overview?.usage.unavailable
            ? "spend ledger unreadable"
            : `${overview?.usage.remainingCredits ?? 0} credits remaining`}
        </Badge>
        {ks?.stoppedAgents.length ? (
          <Badge variant="destructive">{ks.stoppedAgents.length} agents stopped</Badge>
        ) : null}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => void kill(true)}>
            <Square className="mr-1 h-4 w-4" /> Stop all agents
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void kill(false)}>
            Release
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-3">
        <HappyUniversalPromptBar
          defaultSurface="chat"
          defaultMode="build"
          busy={busy}
          placeholder='Evaluate an action, e.g. "Delete all archived customer records."'
          draftKey="happy.governance"
          onSend={simulate}
        />
      </section>

      {preview ? (
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            <Badge variant={preview.decision.allowed ? "secondary" : "destructive"}>{preview.decision.code}</Badge>
            <Badge variant="outline">{preview.decision.actionClass}</Badge>
            <Badge variant="outline">stage: {preview.decision.stage}</Badge>
            <Badge variant="outline">{preview.decision.reversibility}</Badge>
            <Badge variant="outline">{preview.decision.estimatedCost} credits</Badge>
            {preview.decision.requiresApproval ? <Badge variant="destructive">approval required</Badge> : null}
            {preview.decision.hardStop ? <Badge variant="destructive">hard stop</Badge> : null}
          </div>
          <p className="text-sm">{preview.decision.explanation}</p>
          <p className="text-xs text-muted-foreground">
            reason: <code>{preview.decision.reason}</code> · agent: {preview.resolution.agentTitle} · skill:{" "}
            {preview.resolution.skillName} · tool: {preview.resolution.toolName}
          </p>
          {preview.approvalRequest ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-1">
              <p className="font-medium">Founder approval object</p>
              <p>Impact: {preview.approvalRequest.expected_impact}</p>
              <p>
                Risk: {preview.approvalRequest.risk_level} · Cost: {preview.approvalRequest.estimated_cost_credits}{" "}
                credits · Scope: {preview.approvalRequest.execution_scope.data_scope}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Agent capability grants (default DENY)
          </h2>
          <Link to="/agents" className="ml-auto text-xs underline text-muted-foreground">
            Agent Workforce
          </Link>
        </div>
        <ul className="divide-y rounded-xl border bg-card">
          {matrix.map((row) => (
            <li key={row.agentId} className="flex flex-wrap items-center gap-2 p-3 text-sm">
              <span className="font-medium">{row.title}</span>
              <Badge variant={row.granted ? "secondary" : "destructive"}>
                {row.granted ? "granted" : "no capabilities"}
              </Badge>
              {row.toolCategories.map((c) => (
                <Badge key={c} variant="outline" className="text-[10px]">
                  {c}
                </Badge>
              ))}
              <span className="ml-auto text-[10px] text-muted-foreground">
                scopes: {row.dataScopes.join(", ") || "none"} · delegation depth {row.maxDelegationDepth}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
