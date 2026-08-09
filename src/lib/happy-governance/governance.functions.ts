/**
 * R301 — Founder Governance server functions (thin wrappers only).
 *
 * Surfaces the autonomy gate for Founder inspection and control. Every handler
 * re-derives identity server-side; nothing about roles, budgets, approval or
 * kill-switch state is ever accepted from the client.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { HAPPY_AGENTS } from "@/lib/happy-command/agent-roster";
import {
  engageKillSwitch,
  governanceOverview,
  releaseKillSwitch,
  simulateGate,
  type KillSwitchCommand,
} from "./governance-admin.server";

export const getGovernanceOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => governanceOverview(context.supabase, context.userId));

export const getCapabilityMatrix = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { capabilityMatrix } = await import("./capability-matrix");
    return capabilityMatrix(HAPPY_AGENTS.map((a) => ({ id: a.id, title: a.title, owner: a.owner })));
  });

export const previewAutonomyGate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { task: string; agent?: string; missionId?: string | null }) => ({
    task: String(data?.task ?? "").slice(0, 2000),
    agent: data?.agent ? String(data.agent).slice(0, 64) : undefined,
    missionId: data?.missionId ? String(data.missionId).slice(0, 64) : null,
  }))
  .handler(async ({ data, context }) => simulateGate(context.supabase, context.userId, data));

export const setKillSwitch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: KillSwitchCommand) => ({
    level: data?.level,
    engage: Boolean(data?.engage),
    agentId: data?.agentId ? String(data.agentId).slice(0, 64) : null,
    missionId: data?.missionId ? String(data.missionId).slice(0, 64) : null,
    correlationId: data?.correlationId ? String(data.correlationId).slice(0, 128) : null,
    reason: String(data?.reason ?? "").slice(0, 500),
  }))
  .handler(async ({ data, context }) =>
    data.engage
      ? engageKillSwitch(context.supabase, context.userId, data)
      : releaseKillSwitch(context.supabase, context.userId, data),
  );
