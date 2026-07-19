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
  health: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
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
      health: healthCounts,
    };
  });
