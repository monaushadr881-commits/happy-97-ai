/**
 * /missions — HAPPY AUTONOMOUS MISSION SYSTEM
 *
 * Extends `src/lib/happy-command/mission.functions.ts` and reuses the
 * canonical `HappyUniversalPromptBar` + `HappyUniversalActionBar`.
 * No second composer, no duplicate runtime, no duplicate approval engine.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { HappyUniversalPromptBar } from "@/components/happy/HappyUniversalPromptBar";
import { HappyUniversalActionBar } from "@/components/happy/HappyUniversalActionBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  abortMission,
  advanceMission,
  approveMission,
  listMissions,
  planMission,
  reportMission,
  startMission,
  verifyMission,
} from "@/lib/happy-command/mission.functions";
import { MISSION_PHASES, type MissionBlueprint, type MissionRecord } from "@/lib/happy-command/mission-core";

export const Route = createFileRoute("/_authenticated/missions")({
  head: () => ({
    meta: [
      { title: "HAPPY Missions — autonomous goal execution" },
      {
        name: "description",
        content:
          "Give HAPPY a goal. HAPPY plans it, assigns AI agents, executes phase by phase, verifies the result, reports, and keeps monitoring.",
      },
      { property: "og:title", content: "HAPPY Missions" },
      {
        property: "og:description",
        content: "Goal → Plan → Tasks → Agents → Execution → Verification → Result → Report → Monitoring.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MissionsPage,
});

function riskTone(risk: string) {
  if (risk === "high") return "destructive" as const;
  if (risk === "medium") return "secondary" as const;
  return "outline" as const;
}

function statusTone(status: MissionRecord["status"]) {
  if (status === "aborted") return "destructive" as const;
  if (status === "completed" || status === "verified") return "default" as const;
  return "secondary" as const;
}

function MissionsPage() {
  const runPlan = useServerFn(planMission);
  const runStart = useServerFn(startMission);
  const runApprove = useServerFn(approveMission);
  const runAdvance = useServerFn(advanceMission);
  const runVerify = useServerFn(verifyMission);
  const runReport = useServerFn(reportMission);
  const runList = useServerFn(listMissions);
  const runAbort = useServerFn(abortMission);

  const [busy, setBusy] = React.useState(false);
  const [blueprint, setBlueprint] = React.useState<MissionBlueprint | null>(null);
  const [missions, setMissions] = React.useState<MissionRecord[]>([]);
  const [pendingApproval, setPendingApproval] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const res = await runList({ data: { limit: 20 } });
      setMissions(res.missions);
    } catch {
      /* best-effort */
    }
  }, [runList]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSend = React.useCallback(
    async (payload: { prompt: string }) => {
      const goal = payload.prompt.trim();
      if (!goal) {
        toast.error("Give HAPPY a mission goal first.");
        return;
      }
      setBusy(true);
      setReport(null);
      try {
        const bp = await runPlan({ data: { goal } });
        setBlueprint(bp);
        const res = await runStart({ data: { goal, confirmed: !bp.requiresApproval } });
        if (res.status === "awaiting_approval") {
          setPendingApproval(res.mission_id);
          toast.warning("This mission is high-impact — approve it to start execution.");
        } else {
          setPendingApproval(null);
          toast.success(`Mission started · ${bp.intentLabel}`);
        }
        await refresh();
      } catch (e) {
        toast.error(`Mission could not start · ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [runPlan, runStart, refresh],
  );

  const act = React.useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await fn();
        toast.success(label);
        await refresh();
      } catch (e) {
        toast.error(`${label} failed · ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const showReport = React.useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        const res = await runReport({ data: { id } });
        setReport(res.summary);
      } catch (e) {
        toast.error(`Report failed · ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [runReport],
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">HAPPY Missions</h1>
        <p className="text-sm text-muted-foreground">
          Give HAPPY a goal. HAPPY plans it, assigns AI agents, executes phase by phase, verifies the result, reports
          back, and keeps monitoring — asking for approval before anything high-impact.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {MISSION_PHASES.map((p, i) => (
          <Badge key={p} variant="outline" className="capitalize">
            {i + 1}. {p}
          </Badge>
        ))}
      </div>

      <section className="rounded-xl border bg-card p-3">
        <HappyUniversalPromptBar
          defaultSurface="chat"
          defaultMode="build"
          busy={busy}
          placeholder='e.g. "HAPPY, launch a customer support AI employee for my delivery business."'
          draftKey="happy.missions"
          onSend={handleSend}
        />
      </section>

      {blueprint ? (
        <section className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{blueprint.intentLabel}</Badge>
            <Badge variant={riskTone(blueprint.risk)}>{blueprint.risk} risk</Badge>
            <Badge variant="outline">{blueprint.tasks.length} tasks</Badge>
            {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            <Link to={blueprint.targetRoute} className="text-xs underline text-muted-foreground ml-auto">
              {blueprint.targetRoute}
            </Link>
          </div>

          <dl className="grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Goal</dt>
              <dd>{blueprint.goal}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Impact</dt>
              <dd>{blueprint.impact}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Expected result</dt>
              <dd>{blueprint.expectedResult}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">AI team</dt>
              <dd>{blueprint.agents.join(", ")}</dd>
            </div>
          </dl>

          <ol className="space-y-2">
            {blueprint.tasks.map((t) => (
              <li key={t.order} className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm">
                <span className="text-xs text-muted-foreground w-6">{t.order}</span>
                <span className="font-medium">{t.stage}</span>
                <Badge variant="secondary">{t.agentTitle}</Badge>
                <Badge variant={t.autonomous ? "outline" : "destructive"}>
                  {t.autonomous ? "autonomous" : "approval-gated"}
                </Badge>
                <code className="text-[11px] text-muted-foreground ml-auto">{t.owner}</code>
              </li>
            ))}
          </ol>

          {pendingApproval ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <span className="text-sm">HAPPY will not execute this mission until you approve it.</span>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    act("Mission approved", async () => {
                      await runApprove({ data: { id: pendingApproval } });
                      setPendingApproval(null);
                    })
                  }
                >
                  <ShieldCheck className="h-4 w-4 mr-1" /> Approve mission
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    act("Mission aborted", async () => {
                      await runAbort({ data: { id: pendingApproval, reason: "Rejected by Founder" } });
                      setPendingApproval(null);
                      setBlueprint(null);
                    })
                  }
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          ) : null}

          <HappyUniversalActionBar mode="mission-control" payload={blueprint} compact />
        </section>
      ) : null}

      {report ? (
        <section className="rounded-xl border bg-card p-4 text-sm">
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Mission report</h2>
          <p>{report}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Missions</h2>
        {missions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No missions yet.</p>
        ) : (
          <ul className="space-y-2">
            {missions.map((m) => (
              <li key={m.id} className="rounded-xl border bg-card p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline">{m.intentLabel}</Badge>
                  <span className="truncate max-w-[40ch]">{m.goal || "—"}</span>
                  <Badge variant={statusTone(m.status)} className="ml-auto capitalize">
                    {m.status.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {m.phase} · {m.progress}%
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.status === "awaiting_approval" ? (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => act("Mission approved", () => runApprove({ data: { id: m.id } }))}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || m.status === "aborted"}
                      onClick={() => act("Mission advanced", () => runAdvance({ data: { id: m.id } }))}
                    >
                      Advance phase
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || m.status === "aborted"}
                    onClick={() =>
                      act("Verification recorded", () => runVerify({ data: { id: m.id, passed: true } }))
                    }
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Verify passed
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => void showReport(m.id)}>
                    Report
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy || m.status === "aborted"}
                    onClick={() =>
                      act("Mission aborted", () => runAbort({ data: { id: m.id, reason: "Aborted by Founder" } }))
                    }
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Abort
                  </Button>
                  <Link to={m.targetRoute} className="ml-auto text-xs underline text-muted-foreground self-center">
                    {m.targetRoute}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
