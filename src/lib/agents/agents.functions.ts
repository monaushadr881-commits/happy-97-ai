// R31 HAPPY AI Agent Platform — server function surface
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  agentRegister, agentSeedSystem, agentList, agentGet, agentResolveByCode,
  taskAssign, taskStart, taskComplete, tasksList, taskDetail,
  toolCall, agentSay, agentHealth, routeTaskType,
  type AgentRegisterInput, type AgentCode, type TaskAssignInput, type ToolCallInput,
} from "./engine";

export const agRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: AgentRegisterInput) => d)
  .handler(async ({ data, context }) => agentRegister(context.supabase, context.userId, data));

export const agSeedSystem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => agentSeedSystem(context.supabase, context.userId, data.company_id));

export const agList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; active?: boolean }) => d)
  .handler(async ({ data, context }) => agentList(context.supabase, context.userId, data));

export const agGet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => agentGet(context.supabase, context.userId, data.id));

export const agResolve = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; code: AgentCode }) => d)
  .handler(async ({ data, context }) => agentResolveByCode(context.supabase, context.userId, data.company_id, data.code));

export const agRouteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { task_type: string }) => d)
  .handler(async ({ data }) => ({ agent_code: routeTaskType(data.task_type) }));

export const agTaskAssign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: TaskAssignInput) => d)
  .handler(async ({ data, context }) => taskAssign(context.supabase, context.userId, data));

export const agTaskStart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { task_id: string }) => d)
  .handler(async ({ data, context }) => taskStart(context.supabase, context.userId, data.task_id));

export const agTaskComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { task_id: string; status: "succeeded" | "failed" | "escalated"; result?: Record<string, any>; error?: string; escalate_to_code?: AgentCode; escalation_reason?: string }) => d)
  .handler(async ({ data, context }) => taskComplete(context.supabase, context.userId, data));

export const agTasksList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; agent_id?: string; status?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => tasksList(context.supabase, context.userId, data));

export const agTaskDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { task_id: string }) => d)
  .handler(async ({ data, context }) => taskDetail(context.supabase, context.userId, data.task_id));

export const agToolCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ToolCallInput) => d)
  .handler(async ({ data, context }) => toolCall(context.supabase, context.userId, data));

export const agSay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; task_id?: string; from_agent_id?: string; to_agent_id?: string; to_user_id?: string; channel: "agent" | "brain" | "automation" | "founder" | "user" | "system"; role?: "system" | "user" | "assistant" | "tool"; content: string; metadata?: Record<string, any> }) => d)
  .handler(async ({ data, context }) => agentSay(context.supabase, context.userId, data));

export const agHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => agentHealth(context.supabase, context.userId, data.company_id));
