/**
 * R183 Batch F — Founder Mission Control Aggregator
 *
 * SINGLE canonical read-only aggregator that powers the extended Founder
 * Dashboard (Mission Control panels). It does NOT create new tables,
 * runtimes, or business logic — it only reads existing canonical tables
 * under RLS (`is_platform_founder` policies apply):
 *
 *   public.approvals              → Founder R158 approvals
 *   public.audit_logs             → canonical audit timeline
 *   public.brain_sessions         → Brain runtime status
 *   public.brain_tool_calls       → Brain tool executions
 *   public.job_queue              → background jobs
 *   public.invoices               → Revenue OS activity
 *   public.creator_assets         → Creator / Publishing artefacts
 *   public.ai_knowledge_documents → Knowledge updates
 *   public.health_checks          → runtime health probes
 *
 * No writes. No new services. Reuses `requireSupabaseAuth`.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LIMIT = 8;

export interface MissionControlSnapshot {
  approvals: {
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    recent: Array<{
      id: string;
      title: string;
      status: string;
      entity_type: string;
      created_at: string;
      amount_cents: number | null;
      currency: string | null;
    }>;
  };
  audit: Array<{
    id: string;
    category: string;
    action: string;
    entity_type: string | null;
    severity: string | null;
    occurred_at: string;
  }>;
  brain: {
    active: number;
    completed_24h: number;
    recent_tool_calls: Array<{
      id: string;
      tool: string;
      status: string;
      runtime: string;
      created_at: string;
      duration_ms: number | null;
    }>;
  };
  jobs: {
    pending: number;
    running: number;
    failed: number;
    done: number;
  };
  revenue: {
    invoices_30d: number;
    outstanding_cents: number;
    paid_cents: number;
    recent: Array<{
      id: string;
      number: string;
      status: string;
      total_cents: number;
      currency: string;
      issued_at: string | null;
    }>;
  };
  creator: {
    total: number;
    by_kind: Record<string, number>;
    recent: Array<{
      id: string;
      name: string;
      kind: string;
      created_at: string;
    }>;
  };
  knowledge: Array<{
    id: string;
    title: string;
    updated_at: string;
  }>;
  publishing: {
    total_packages: number;
    total_assets: number;
    pending_approvals: number;
    by_store: Record<string, number>;
    recent: Array<{
      id: string;
      name: string;
      store: string;
      app_name: string;
      app_version: string;
      package_version: number;
      asset_kind: string;
      created_at: string;
    }>;
  };
  executive: {
    total_reviews: number;
    pending: number;
    approved: number;
    rejected: number;
    conflicts_open: number;
    top_risks: Array<{ risk: string; count: number }>;
    recent: Array<{
      id: string;
      approval_id: string;
      title: string;
      status: string;
      unified: string;
      conflicts: number;
      created_at: string;
    }>;
    member_tally: Record<string, { go: number; hold: number; no_go: number }>;
  };
  founder_creator: {
    total_requests: number;
    pending: number;
    approved: number;
    rejected: number;
    total_assets: number;
    by_kind: Record<string, number>;
    recent_requests: Array<{
      id: string;
      title: string;
      status: string;
      kind: string;
      created_at: string;
    }>;
    recent_assets: Array<{
      id: string;
      name: string;
      kind: string;
      asset_version: number;
      model: string | null;
      created_at: string;
    }>;
  };
  health: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  revenue_ext: {
    wallets: { total: number; ledger_30d: number };
    credits: { grants_30d: number; consumes_30d: number };
    subscriptions: {
      active: number;
      trial: number;
      paused: number;
      cancelled: number;
      recent: Array<{
        id: string;
        status: string;
        plan_id: string;
        seats: number;
        updated_at: string;
      }>;
    };
    payments: {
      succeeded_30d: number;
      failed_30d: number;
      pending_founder_approval: number;
      recent: Array<{
        id: string;
        amount_cents: number;
        currency: string;
        status: string;
        received_at: string | null;
      }>;
    };
    daily_free_credit_policy: {
      per_day: number;
      deduction_order: ReadonlyArray<string>;
    };
  };
  automation: {
    workflows_total: number;
    workflows_active: number;
    workflows_inactive: number;
    pending_approvals: number;
    runs_24h: number;
    runs_failed_24h: number;
    recent_runs: Array<{
      id: string;
      workflow_id: string;
      status: string;
      started_at: string | null;
      completed_at: string | null;
      error: string | null;
    }>;
  };
}

export const founderMissionControl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MissionControlSnapshot> => {
    const sb = context.supabase;
    const since24h = new Date(Date.now() - 24 * 3600_000).toISOString();
    const since30d = new Date(Date.now() - 30 * 86400_000).toISOString();

    const cnt = (n: number | null | undefined) => n ?? 0;

    const [
      apPending,
      apApproved,
      apRejected,
      apCancelled,
      apRecent,
      auditRecent,
      brainActive,
      brainDone24h,
      brainCalls,
      jobPending,
      jobRunning,
      jobFailed,
      jobDone,
      invCount30d,
      invRecent,
      creatorRecent,
      knowledgeRecent,
      healthRecent,
      publishingPending,
      publishingRecent,
    ] = await Promise.all([
      sb.from("approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("approvals").select("id", { count: "exact", head: true }).eq("status", "approved"),
      sb.from("approvals").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      sb.from("approvals").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
      sb
        .from("approvals")
        .select("id,title,status,entity_type,created_at,amount_cents,currency")
        .order("created_at", { ascending: false })
        .limit(LIMIT),
      sb
        .from("audit_logs")
        .select("id,category,action,entity_type,severity,occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(12),
      sb.from("brain_sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb
        .from("brain_sessions")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", since24h),
      sb
        .from("brain_tool_calls")
        .select("id,tool,status,runtime,created_at,duration_ms")
        .order("created_at", { ascending: false })
        .limit(LIMIT),
      sb.from("job_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
      sb.from("job_queue").select("id", { count: "exact", head: true }).eq("status", "running"),
      sb.from("job_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
      sb.from("job_queue").select("id", { count: "exact", head: true }).eq("status", "succeeded"),
      sb.from("invoices").select("id", { count: "exact", head: true }).gte("created_at", since30d),
      sb
        .from("invoices")
        .select(
          "id,number,status,total_cents,amount_paid_cents,currency,issued_at,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(LIMIT),
      sb
        .from("creator_assets")
        .select("id,name,kind,created_at")
        .order("created_at", { ascending: false })
        .limit(24),
      sb
        .from("ai_knowledge_documents")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false })
        .limit(LIMIT),
      sb
        .from("health_checks")
        .select("status,checked_at")
        .gte("checked_at", since24h)
        .limit(500),
      sb
        .from("approvals")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("entity_type", "founder_publishing_package"),
      sb
        .from("creator_assets")
        .select("id,name,created_at,metadata")
        .eq("kind", "publishing")
        .order("created_at", { ascending: false })
        .limit(64),
    ]);

    // Batch J — Revenue OS extension reads. Kept as a small parallel
    // batch outside the main Promise.all so its typings stay isolated
    // and additions don't ripple through the primary tuple.
    const [
      walletsTotal,
      walletLedger30d,
      creditsGrant30d,
      creditsConsume30d,
      subsActive,
      subsTrial,
      subsPaused,
      subsCancelled,
      subsRecent,
      paySuccess30d,
      payFailed30d,
      payPendingApproval,
      payRecent,
    ] = await Promise.all([
      sb.from("wallets").select("id", { count: "exact", head: true }),
      sb.from("wallet_ledger_entries").select("id", { count: "exact", head: true }).gte("created_at", since30d),
      sb.from("credit_ledger_entries").select("id", { count: "exact", head: true }).eq("direction", "credit").gte("created_at", since30d),
      sb.from("credit_ledger_entries").select("id", { count: "exact", head: true }).eq("direction", "debit").gte("created_at", since30d),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "trial"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "paused"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
      sb.from("subscriptions").select("id,status,plan_id,seats,updated_at").order("updated_at", { ascending: false }).limit(LIMIT),
      sb.from("payments").select("id", { count: "exact", head: true }).eq("status", "succeeded").gte("received_at", since30d),
      sb.from("payments").select("id", { count: "exact", head: true }).eq("status", "failed").gte("received_at", since30d),
      sb.from("approvals").select("id", { count: "exact", head: true }).eq("status", "pending").eq("entity_type", "revenue.payment"),
      sb.from("payments").select("id,amount_cents,currency,status,received_at").order("received_at", { ascending: false, nullsFirst: false }).limit(LIMIT),
    ]);

    // Executive Board reviews — separate query so the Promise.all
    // above stays typed. Cheap: capped at 64 rows, RLS-scoped.
    const execRecent = await sb
      .from("approvals")
      .select("id,title,status,entity_id,created_at,metadata")
      .eq("entity_type", "founder_executive_review")
      .order("created_at", { ascending: false })
      .limit(64);

    const invRows = invRecent.data ?? [];
    const outstanding = invRows.reduce(
      (s, r) =>
        s + Math.max(0, (r.total_cents ?? 0) - (r.amount_paid_cents ?? 0)),
      0,
    );
    const paid = invRows.reduce((s, r) => s + (r.amount_paid_cents ?? 0), 0);

    const creatorRows = creatorRecent.data ?? [];
    const byKind: Record<string, number> = {};
    for (const c of creatorRows) byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;

    // Batch A (R188) — Automation Runtime reads. Small parallel batch
    // so tuple typing stays isolated from the primary Promise.all.
    const [
      wfTotal,
      wfActive,
      wfInactive,
      autoPending,
      runs24h,
      runsFailed24h,
      runsRecent,
    ] = await Promise.all([
      sb.from("workflows").select("id", { count: "exact", head: true }),
      sb.from("workflows").select("id", { count: "exact", head: true }).eq("is_active", true),
      sb.from("workflows").select("id", { count: "exact", head: true }).eq("is_active", false),
      sb.from("approvals").select("id", { count: "exact", head: true })
        .eq("status", "pending").eq("entity_type", "business.automation"),
      sb.from("workflow_runs").select("id", { count: "exact", head: true }).gte("created_at", since24h),
      sb.from("workflow_runs").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since24h),
      sb.from("workflow_runs")
        .select("id,workflow_id,status,started_at,completed_at,error")
        .order("created_at", { ascending: false })
        .limit(LIMIT),
    ]);



    // Founder-initiated Creator Runtime (Batch I) — read approvals +
    // finalized assets tagged by ASSET_SOURCE metadata.source.
    const [fcApprovals, fcAssets] = await Promise.all([
      sb
        .from("approvals")
        .select("id,title,status,created_at,metadata")
        .eq("entity_type", "founder_creator_generation")
        .order("created_at", { ascending: false })
        .limit(64),
      sb
        .from("creator_assets")
        .select("id,name,kind,model,created_at,metadata")
        .contains("metadata", { source: "founder.creator.finalize" } as never)
        .order("created_at", { ascending: false })
        .limit(64),
    ]);

    const healthRows = healthRecent.data ?? [];
    const healthCounts = { total: healthRows.length, healthy: 0, degraded: 0, down: 0 };
    for (const h of healthRows) {
      const st = h.status as string;
      if (st === "healthy") healthCounts.healthy++;
      else if (st === "degraded") healthCounts.degraded++;
      else if (st === "down" || st === "unhealthy") healthCounts.down++;
    }

    return {
      approvals: {
        pending: cnt(apPending.count),
        approved: cnt(apApproved.count),
        rejected: cnt(apRejected.count),
        cancelled: cnt(apCancelled.count),
        recent: (apRecent.data ?? []) as MissionControlSnapshot["approvals"]["recent"],
      },
      audit: (auditRecent.data ?? []) as MissionControlSnapshot["audit"],
      brain: {
        active: cnt(brainActive.count),
        completed_24h: cnt(brainDone24h.count),
        recent_tool_calls:
          (brainCalls.data ?? []) as MissionControlSnapshot["brain"]["recent_tool_calls"],
      },
      jobs: {
        pending: cnt(jobPending.count),
        running: cnt(jobRunning.count),
        failed: cnt(jobFailed.count),
        done: cnt(jobDone.count),
      },
      revenue: {
        invoices_30d: cnt(invCount30d.count),
        outstanding_cents: outstanding,
        paid_cents: paid,
        recent: invRows.map((r) => ({
          id: r.id,
          number: r.number,
          status: r.status as string,
          total_cents: r.total_cents ?? 0,
          currency: r.currency,
          issued_at: r.issued_at,
        })),
      },
      creator: {
        total: creatorRows.length,
        by_kind: byKind,
        recent: creatorRows.slice(0, LIMIT).map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
          created_at: c.created_at,
        })),
      },
      knowledge: (knowledgeRecent.data ?? []) as MissionControlSnapshot["knowledge"],
      publishing: (() => {
        const rows = (publishingRecent.data ?? []) as Array<{
          id: string;
          name: string;
          created_at: string;
          metadata: Record<string, unknown> | null;
        }>;
        const packageIds = new Set<string>();
        const byStore: Record<string, number> = {};
        const recent = rows.slice(0, LIMIT).map((r) => {
          const m = (r.metadata ?? {}) as Record<string, unknown>;
          const pid = typeof m.package_id === "string" ? m.package_id : "";
          if (pid) packageIds.add(pid);
          return {
            id: r.id,
            name: r.name,
            store: typeof m.store === "string" ? m.store : "",
            app_name: typeof m.app_name === "string" ? m.app_name : "",
            app_version: typeof m.app_version === "string" ? m.app_version : "",
            package_version:
              typeof m.package_version === "number" ? m.package_version : 1,
            asset_kind: typeof m.asset_kind === "string" ? m.asset_kind : "",
            created_at: r.created_at,
          };
        });
        for (const r of rows) {
          const m = (r.metadata ?? {}) as Record<string, unknown>;
          const s = typeof m.store === "string" ? m.store : "unknown";
          byStore[s] = (byStore[s] ?? 0) + 1;
          if (typeof m.package_id === "string") packageIds.add(m.package_id);
        }
        return {
          total_packages: packageIds.size,
          total_assets: rows.length,
          pending_approvals: cnt(publishingPending.count),
          by_store: byStore,
          recent,
        };
      })(),
      executive: (() => {
        const rows = (execRecent.data ?? []) as Array<{
          id: string;
          title: string;
          status: string;
          entity_id: string;
          created_at: string;
          metadata: Record<string, unknown> | null;
        }>;
        const tally = { pending: 0, approved: 0, rejected: 0 };
        let conflictsOpen = 0;
        const riskMap = new Map<string, number>();
        const memberTally: Record<
          string,
          { go: number; hold: number; no_go: number }
        > = {};
        const recent = rows.slice(0, LIMIT).map((r) => {
          const m = (r.metadata ?? {}) as Record<string, unknown>;
          const review = (m.review ?? {}) as {
            unified?: { recommendation?: string };
            conflicts?: unknown[];
          };
          const unified = review.unified?.recommendation ?? "unknown";
          const conflicts = Array.isArray(review.conflicts)
            ? review.conflicts.length
            : 0;
          return {
            id: r.entity_id,
            approval_id: r.id,
            title: r.title,
            status: r.status,
            unified,
            conflicts,
            created_at: r.created_at,
          };
        });
        for (const r of rows) {
          if (r.status === "pending") tally.pending++;
          else if (r.status === "approved") tally.approved++;
          else if (r.status === "rejected") tally.rejected++;
          const m = (r.metadata ?? {}) as Record<string, unknown>;
          const review = (m.review ?? {}) as {
            conflicts?: unknown[];
            top_risks?: Array<{ risk?: string; count?: number }>;
            members?: Array<{ member_id?: string; recommendation?: string }>;
          };
          if (r.status === "pending" && Array.isArray(review.conflicts))
            conflictsOpen += review.conflicts.length;
          if (Array.isArray(review.top_risks)) {
            for (const tr of review.top_risks) {
              if (typeof tr.risk === "string")
                riskMap.set(
                  tr.risk,
                  (riskMap.get(tr.risk) ?? 0) + (tr.count ?? 1),
                );
            }
          }
          if (Array.isArray(review.members)) {
            for (const mm of review.members) {
              const id = typeof mm.member_id === "string" ? mm.member_id : "";
              if (!id) continue;
              const bucket =
                memberTally[id] ?? (memberTally[id] = { go: 0, hold: 0, no_go: 0 });
              if (mm.recommendation === "go") bucket.go++;
              else if (mm.recommendation === "hold") bucket.hold++;
              else if (mm.recommendation === "no_go") bucket.no_go++;
            }
          }
        }
        const top_risks = Array.from(riskMap.entries())
          .map(([risk, count]) => ({ risk, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        return {
          total_reviews: rows.length,
          pending: tally.pending,
          approved: tally.approved,
          rejected: tally.rejected,
          conflicts_open: conflictsOpen,
          top_risks,
          recent,
          member_tally: memberTally,
        };
      })(),
      founder_creator: (() => {
        const arows = (fcApprovals.data ?? []) as Array<{
          id: string;
          title: string;
          status: string;
          created_at: string;
          metadata: Record<string, unknown> | null;
        }>;
        const srows = (fcAssets.data ?? []) as Array<{
          id: string;
          name: string;
          kind: string;
          model: string | null;
          created_at: string;
          metadata: Record<string, unknown> | null;
        }>;
        const tally = { pending: 0, approved: 0, rejected: 0 };
        const byKind: Record<string, number> = {};
        for (const r of arows) {
          if (r.status === "pending") tally.pending++;
          else if (r.status === "approved") tally.approved++;
          else if (r.status === "rejected") tally.rejected++;
          const m = (r.metadata ?? {}) as Record<string, unknown>;
          const k = typeof m.kind === "string" ? m.kind : "unknown";
          byKind[k] = (byKind[k] ?? 0) + 1;
        }
        return {
          total_requests: arows.length,
          pending: tally.pending,
          approved: tally.approved,
          rejected: tally.rejected,
          total_assets: srows.length,
          by_kind: byKind,
          recent_requests: arows.slice(0, LIMIT).map((r) => {
            const m = (r.metadata ?? {}) as Record<string, unknown>;
            return {
              id: r.id,
              title: r.title,
              status: r.status,
              kind: typeof m.kind === "string" ? m.kind : "unknown",
              created_at: r.created_at,
            };
          }),
          recent_assets: srows.slice(0, LIMIT).map((s) => {
            const m = (s.metadata ?? {}) as Record<string, unknown>;
            return {
              id: s.id,
              name: s.name,
              kind: typeof m.founder_kind === "string" ? m.founder_kind : s.kind,
              asset_version:
                typeof m.asset_version === "number" ? m.asset_version : 1,
              model: s.model,
              created_at: s.created_at,
            };
          }),
        };
      })(),
      health: healthCounts,
      revenue_ext: {
        wallets: { total: cnt(walletsTotal.count), ledger_30d: cnt(walletLedger30d.count) },
        credits: {
          grants_30d: cnt(creditsGrant30d.count),
          consumes_30d: cnt(creditsConsume30d.count),
        },
        subscriptions: {
          active: cnt(subsActive.count),
          trial: cnt(subsTrial.count),
          paused: cnt(subsPaused.count),
          cancelled: cnt(subsCancelled.count),
          recent: ((subsRecent.data ?? []) as Array<{
            id: string; status: string; plan_id: string; seats: number; updated_at: string;
          }>).map((r) => ({
            id: r.id, status: r.status, plan_id: r.plan_id,
            seats: r.seats, updated_at: r.updated_at,
          })),
        },
        payments: {
          succeeded_30d: cnt(paySuccess30d.count),
          failed_30d: cnt(payFailed30d.count),
          pending_founder_approval: cnt(payPendingApproval.count),
          recent: ((payRecent.data ?? []) as Array<{
            id: string; amount_cents: number | null; currency: string;
            status: string; received_at: string | null;
          }>).map((r) => ({
            id: r.id,
            amount_cents: r.amount_cents ?? 0,
            currency: r.currency,
            status: r.status,
            received_at: r.received_at,
          })),
        },
        daily_free_credit_policy: {
          per_day: 5,
          deduction_order: ["daily_free", "subscription", "purchased"] as const,
        },
      },
      automation: {
        workflows_total: cnt(wfTotal.count),
        workflows_active: cnt(wfActive.count),
        workflows_inactive: cnt(wfInactive.count),
        pending_approvals: cnt(autoPending.count),
        runs_24h: cnt(runs24h.count),
        runs_failed_24h: cnt(runsFailed24h.count),
        recent_runs: ((runsRecent.data ?? []) as Array<{
          id: string; workflow_id: string; status: string;
          started_at: string | null; completed_at: string | null; error: string | null;
        }>).map((r) => ({
          id: r.id,
          workflow_id: r.workflow_id,
          status: r.status,
          started_at: r.started_at,
          completed_at: r.completed_at,
          error: r.error,
        })),
      },
    };
  });

