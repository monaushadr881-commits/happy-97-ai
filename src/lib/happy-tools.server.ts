/**
 * HAPPY Tools — the platform capabilities HAPPY can invoke through
 * function-calling. Every tool is read-scoped by RLS to the caller.
 * A tool may return a `client_action` (navigate, invalidate) which the
 * frontend applies after HAPPY finishes speaking.
 *
 * Server-only (.server.ts): never imported into the browser bundle.
 */
import { makeServiceContext } from "@/services/core/context";
import {
  analyticsService, notificationService,
} from "@/services";
import { healthService, queueOpsService, deploymentService, securityOpsService } from "@/ops";

type Sb = Parameters<typeof makeServiceContext>[0]["supabase"];
type ToolCtx = { supabase: Sb; userId: string; claims?: Record<string, unknown> };
type ClientAction =
  | { type: "navigate"; to: string; label?: string }
  | { type: "invalidate"; keys: string[]; label?: string }
  | { type: "toast"; kind: "success" | "info" | "warning" | "error"; message: string };

export type ToolResult = { data?: unknown; error?: string; client_actions?: ClientAction[] };

const svc = (c: ToolCtx) => makeServiceContext({ supabase: c.supabase, userId: c.userId, claims: c.claims });

// ─── OpenAI-compatible tool schema ──────────────────────────────────────────
export const HAPPY_TOOLS = [
  {
    type: "function",
    function: {
      name: "platform_overview",
      description: "Live headline counts across the HAPPY platform: companies, users, workspaces, brands, ai_sessions, conversations, deployments, notifications. Use for questions like 'how many users?', 'today's numbers', 'platform stats'.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "platform_health",
      description: "Real health-probe results for every registered service (db, auth, storage, ai, ...). Returns an array of { service, status, latencyMs }.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "queue_stats",
      description: "Job-queue counters: queued, running, succeeded, failed, cancelled. Use for 'why are queues growing?', 'how many failed jobs?'.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "deployment_stats",
      description: "Deployment analytics: total, succeeded, failed, inProgress.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "security_summary",
      description: "Security posture snapshot for the platform (recent auth-critical events, RLS-safe).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "unread_notifications_count",
      description: "Unread notification count for the current user.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "list_notifications",
      description: "List the current user's recent notifications, most recent first.",
      parameters: {
        type: "object",
        properties: {
          filter: { type: "string", enum: ["all", "unread", "read"], description: "Status filter." },
          kind:   { type: "string", description: "Optional category: system, security, deployment, marketplace, billing, digital_human, founder." },
          limit:  { type: "integer", minimum: 1, maximum: 50 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_all_notifications_read",
      description: "Mark every unread notification of the current user as read. Use when the user says 'mark all read', 'clear my inbox'.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "open_route",
      description: "Ask the app to navigate the user to an in-app route. Use for 'open notification center', 'take me to the founder dashboard'.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Absolute app path such as /notifications, /founder, /digital-human." },
          label: { type: "string", description: "Short human label for the destination." },
        },
        required: ["to"],
        additionalProperties: false,
      },
    },
  },
] as const;

// ─── Dispatcher ─────────────────────────────────────────────────────────────
export async function runHappyTool(name: string, rawArgs: unknown, ctx: ToolCtx): Promise<ToolResult> {
  const args = (rawArgs && typeof rawArgs === "object" ? rawArgs : {}) as Record<string, unknown>;
  try {
    switch (name) {
      case "platform_overview": {
        const data = await analyticsService.platformOverview(svc(ctx));
        return { data };
      }
      case "platform_health": {
        const data = await healthService.all(svc(ctx));
        return { data };
      }
      case "queue_stats": {
        const data = await queueOpsService.stats(svc(ctx));
        return { data };
      }
      case "deployment_stats": {
        const data = await deploymentService.analytics(svc(ctx));
        return { data };
      }
      case "security_summary": {
        const data = await securityOpsService.summary(svc(ctx));
        return { data };
      }
      case "unread_notifications_count": {
        const data = await notificationService.unreadCount(svc(ctx));
        return { data };
      }
      case "list_notifications": {
        const data = await notificationService.list(svc(ctx), {
          filter: (args.filter as "all" | "unread" | "read") ?? "all",
          kind: typeof args.kind === "string" ? args.kind : undefined,
          limit: typeof args.limit === "number" ? Math.min(50, args.limit) : 10,
        });
        return { data };
      }
      case "mark_all_notifications_read": {
        const data = await notificationService.markAllRead(svc(ctx));
        return {
          data,
          client_actions: [
            { type: "invalidate", keys: ["notif"] },
            { type: "toast", kind: "success", message: `Marked ${data.updated} notification${data.updated === 1 ? "" : "s"} as read.` },
          ],
        };
      }
      case "open_route": {
        const to = String(args.to ?? "");
        if (!to.startsWith("/")) return { error: "route must start with /" };
        const label = typeof args.label === "string" ? args.label : undefined;
        return {
          data: { navigated_to: to },
          client_actions: [{ type: "navigate", to, label }],
        };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
