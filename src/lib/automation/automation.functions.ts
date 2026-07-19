// R30 HAPPY Automation Engine — server function surface
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  workflowUpsert, workflowList, workflowGet, workflowSetActive, workflowDelete,
  runStart, approvalDecide, queueProcess, runsList, runDetail, automationHealth,
  type WorkflowInput, type TriggerKind,
} from "./engine";

export const wfUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: WorkflowInput & { id?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wfUpsert", source: "api", module: "automation.wfUpsert" });
    return workflowUpsert(context.supabase, context.userId, data);
  });export const wfList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; active?: boolean; trigger_kind?: TriggerKind; limit?: number }) => d)
  .handler(async ({ data, context }) => workflowList(context.supabase, context.userId, data));

export const wfGet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => workflowGet(context.supabase, context.userId, data.id));

export const wfSetActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; active: boolean }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wfSetActive", source: "api", module: "automation.wfSetActive" });
    return workflowSetActive(context.supabase, context.userId, data.id, data.active);
  });export const wfDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wfDelete", source: "api", module: "automation.wfDelete" });
    return workflowDelete(context.supabase, context.userId, data.id);
  });export const wfRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workflow_id: string; trigger_payload?: Record<string, any>; trigger_kind?: TriggerKind }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wfRun", source: "api", module: "automation.wfRun" });
    return runStart(context.supabase, context.userId, data);
  });export const wfApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { approval_id: string; decision: "approved" | "rejected"; note?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wfApprove", source: "api", module: "automation.wfApprove" });
    return approvalDecide(context.supabase, context.userId, data);
  });export const wfQueueProcess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string; limit?: number }) => d ?? {})
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wfQueueProcess", source: "api", module: "automation.wfQueueProcess" });
    return queueProcess(context.supabase, context.userId, data);
  });export const wfRunsList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; workflow_id?: string; status?: string; limit?: number }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wfRunsList", source: "api", module: "automation.wfRunsList" });
    return runsList(context.supabase, context.userId, data);
  });export const wfRunDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { run_id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wfRunDetail", source: "api", module: "automation.wfRunDetail" });
    return runDetail(context.supabase, context.userId, data.run_id);
  });export const wfHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => automationHealth(context.supabase, context.userId, data.company_id));
