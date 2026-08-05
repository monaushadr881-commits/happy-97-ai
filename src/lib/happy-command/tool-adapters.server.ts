/**
 * HAPPY Tool Adapters — SERVER ONLY (Batch 4).
 *
 * Each adapter performs REAL work against an existing canonical surface.
 * There are no simulated adapters: a tool without an adapter here resolves
 * to CAPABILITY_UNAVAILABLE and nothing is executed (Phase 18).
 *
 * Reuses: the authenticated Supabase client from `requireSupabaseAuth`
 * (RLS applies as the caller) and the existing public API routes.
 * NO new table, NO new runtime, NO new provider.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EXECUTION_TIMEOUT_MS,
  outcome,
  type ExecutionContext,
  type Json,
  type ToolOutcome,
} from "./execution-core";
import { getTool, type WorkforceRisk } from "./tool-registry";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

export interface ToolAdapter {
  readonly toolId: string;
  readonly operations: readonly string[];
  readonly permission: string;
  readonly risk: WorkforceRisk;
  readonly canVerify: boolean;
  validate(input: unknown): { ok: true; value: Record<string, unknown> } | { ok: false; error: string };
  execute(sb: SB, input: Record<string, unknown>, ctx: ExecutionContext): Promise<ToolOutcome>;
}

async function withTimeout<T>(p: PromiseLike<T>): Promise<T | "TIMEOUT"> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"TIMEOUT">((resolve) => {
    timer = setTimeout(() => resolve("TIMEOUT"), EXECUTION_TIMEOUT_MS);
  });
  try {
    return await Promise.race([Promise.resolve<T>(p), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Read-only tables the query adapter may touch. RLS still applies. */
const READ_ALLOWLIST: readonly string[] = ["audit_logs", "approvals", "job_queue"];

const databaseQuery: ToolAdapter = {
  toolId: "tool.database.query",
  operations: ["select"],
  permission: "read:schema",
  risk: "low",
  canVerify: true,
  validate(input) {
    const v = (input ?? {}) as { table?: unknown; limit?: unknown };
    const table = typeof v.table === "string" ? v.table : "audit_logs";
    if (!READ_ALLOWLIST.includes(table)) {
      return { ok: false, error: `Table "${table}" is not in the read allowlist.` };
    }
    const limit = typeof v.limit === "number" ? Math.min(50, Math.max(1, Math.trunc(v.limit))) : 10;
    return { ok: true, value: { table, limit } };
  },
  async execute(sb, input) {
    const table = input['table'] as string;
    const limit = input['limit'] as number;
    const res = await withTimeout(sb.from(table).select("id", { count: "exact" }).limit(limit));
    if (res === "TIMEOUT") return outcome({ status: "TIMEOUT", retryable: true });
    if (res.error) {
      return outcome({ status: "FAILED", error: res.error.message, retryable: true });
    }
    const rows = res.data ?? [];
    return outcome({
      status: "SUCCESS",
      output: { table, rows: rows.length, total: res.count ?? null },
      verification: "VERIFIED",
      verification_note: `PostgREST returned ${rows.length} row(s) under caller RLS.`,
    });
  },
};

const universalSearch: ToolAdapter = {
  toolId: "tool.search.universal",
  operations: ["search"],
  permission: "read:knowledge",
  risk: "low",
  canVerify: true,
  validate(input) {
    const v = (input ?? {}) as { query?: unknown };
    const query = typeof v.query === "string" ? v.query.trim().slice(0, 200) : "";
    if (query.length < 2) return { ok: false, error: "Search query must be at least 2 characters." };
    return { ok: true, value: { query } };
  },
  async execute(sb, input) {
    const query = input['query'] as string;
    const res = await withTimeout(
      sb
        .from("audit_logs")
        .select("id, category, action, occurred_at")
        .or(`action.ilike.%${query}%,category.ilike.%${query}%`)
        .order("occurred_at", { ascending: false })
        .limit(20),
    );
    if (res === "TIMEOUT") return outcome({ status: "TIMEOUT", retryable: true });
    if (res.error) return outcome({ status: "FAILED", error: res.error.message, retryable: true });
    const hits = res.data ?? [];
    return outcome({
      status: "SUCCESS",
      output: { query, hits: hits.length, sample: hits.slice(0, 5) as unknown as Json },
      verification: hits.length > 0 ? "VERIFIED" : "VERIFICATION_FAILED",
      verification_note:
        hits.length > 0
          ? `${hits.length} authorized record(s) matched.`
          : "Query executed but no authorized record matched — result not verified.",
    });
  },
};

const analyticsReport: ToolAdapter = {
  toolId: "tool.analytics.report",
  operations: ["activity_report"],
  permission: "read:analytics",
  risk: "low",
  canVerify: true,
  validate(input) {
    const v = (input ?? {}) as { days?: unknown };
    const days = typeof v.days === "number" ? Math.min(90, Math.max(1, Math.trunc(v.days))) : 7;
    return { ok: true, value: { days } };
  },
  async execute(sb, input) {
    const days = input['days'] as number;
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const res = await withTimeout(
      sb
        .from("audit_logs")
        .select("id", { count: "exact", head: true })
        .gte("occurred_at", since),
    );
    if (res === "TIMEOUT") return outcome({ status: "TIMEOUT", retryable: true });
    if (res.error) return outcome({ status: "FAILED", error: res.error.message, retryable: true });
    return outcome({
      status: "SUCCESS",
      output: { window_days: days, since, events: res.count ?? 0 },
      verification: "VERIFIED",
      verification_note: `Aggregate computed from ${res.count ?? 0} authorized audit event(s).`,
    });
  },
};

const serverFnHealth: ToolAdapter = {
  toolId: "tool.api.serverfn",
  operations: ["health", "status"],
  permission: "read:repo",
  risk: "low",
  canVerify: true,
  validate(input) {
    const v = (input ?? {}) as { endpoint?: unknown };
    const endpoint = v.endpoint === "status" ? "status" : "health";
    return { ok: true, value: { endpoint } };
  },
  async execute(_sb, input) {
    const endpoint = input['endpoint'] as string;
    const base = process.env['VITE_PUBLIC_ORIGIN'] ?? "http://localhost:8080";
    try {
      const res = await withTimeout(fetch(`${base}/api/public/v1/${endpoint}`, { method: "GET" }));
      if (res === "TIMEOUT") return outcome({ status: "TIMEOUT", retryable: true });
      const body = await res.text();
      if (!res.ok) {
        return outcome({
          status: "FAILED",
          error: `HTTP ${res.status}`,
          retryable: res.status >= 500,
          output: { status: res.status },
        });
      }
      return outcome({
        status: "SUCCESS",
        output: { endpoint, http_status: res.status, body: body.slice(0, 500) },
        verification: "VERIFIED",
        verification_note: `Endpoint responded HTTP ${res.status}.`,
      });
    } catch (e) {
      return outcome({
        status: "FAILED",
        error: e instanceof Error ? e.message : "network error",
        retryable: true,
      });
    }
  },
};

export const TOOL_ADAPTERS: readonly ToolAdapter[] = [
  databaseQuery,
  universalSearch,
  analyticsReport,
  serverFnHealth,
];

const ADAPTERS = new Map(TOOL_ADAPTERS.map((a) => [a.toolId, a]));

export function getAdapter(toolId: string | null): ToolAdapter | undefined {
  return toolId ? ADAPTERS.get(toolId) : undefined;
}

export function adapterToolIds(): readonly string[] {
  return TOOL_ADAPTERS.map((a) => a.toolId);
}

/**
 * Canonical TOOL EXECUTOR. Honest by construction: no adapter ⇒
 * CAPABILITY_UNAVAILABLE, never SUCCESS.
 */
export async function executeTool(
  sb: SB,
  toolId: string | null,
  input: unknown,
  ctx: ExecutionContext,
): Promise<ToolOutcome> {
  const tool = toolId ? getTool(toolId) : undefined;
  if (!tool) {
    return outcome({
      status: "CAPABILITY_UNAVAILABLE",
      error: `CAPABILITY_UNAVAILABLE: unknown tool "${toolId ?? "none"}".`,
      verification: "NOT_APPLICABLE",
      verification_note: "Nothing executed.",
    });
  }
  if (tool.availability === "unavailable") {
    return outcome({
      status: "CAPABILITY_UNAVAILABLE",
      error: `CAPABILITY_UNAVAILABLE: ${tool.name} has no wired integration.`,
      verification: "NOT_APPLICABLE",
      verification_note: "Nothing executed.",
    });
  }
  const adapter = getAdapter(tool.id);
  if (!adapter) {
    return outcome({
      status: "CAPABILITY_UNAVAILABLE",
      error: `CAPABILITY_UNAVAILABLE: no execution adapter wired for ${tool.name}.`,
      verification: "NOT_APPLICABLE",
      verification_note: "Nothing executed.",
    });
  }
  const v = adapter.validate(input);
  if (!v.ok) {
    return outcome({
      status: "INVALID_INPUT",
      error: v.error,
      verification: "NOT_APPLICABLE",
      verification_note: "Nothing executed.",
    });
  }
  try {
    return await adapter.execute(sb, v.value, ctx);
  } catch (e) {
    return outcome({
      status: "FAILED",
      error: e instanceof Error ? e.message : "adapter threw",
      retryable: true,
    });
  }
}
