/**
 * HAPPY X — Service Layer: Middleware
 *
 * Composable server-function middleware built on top of TanStack's
 * requireSupabaseAuth. Each middleware provides one concern: tenant
 * scoping, permission checks, rate limiting, audit trail.
 *
 * Use pattern:
 *   .middleware([requireSupabaseAuth, withServiceContext, requirePermission("companies.manage")])
 */

import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext, type ServiceContext } from "./core/context";
import { AppError } from "./core/errors";
import { checkRateLimit, type RateLimitOptions } from "./core/rate-limit";
import { slog } from "./core/logger";
import type { PermissionCode, ScopeType } from "@/enterprise/types";

/** Attaches a ServiceContext to every downstream handler. */
export const withServiceContext = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const svc: ServiceContext = makeServiceContext({
      supabase: context.supabase,
      userId: context.userId,
      claims: context.claims as Record<string, unknown> | undefined,
    });
    return next({ context: { svc } });
  });

/** Rate limits a server function by user + action key. */
export function rateLimit(actionKey: string, opts: RateLimitOptions) {
  return createMiddleware({ type: "function" })
    .middleware([requireSupabaseAuth])
    .server(async ({ next, context }) => {
      checkRateLimit(`${context.userId}:${actionKey}`, opts);
      return next();
    });
}

/** Requires a permission for the caller in a given scope. */
export function requirePermission(code: PermissionCode | string, scope: ScopeType = "platform", scopeId: string | null = null) {
  return createMiddleware({ type: "function" })
    .middleware([requireSupabaseAuth])
    .server(async ({ next, context }) => {
      const { data, error } = await context.supabase.rpc("user_has_permission", {
        _user_id: context.userId, _permission_code: code, _scope_type: scope, _scope_id: scopeId,
      } as never);
      if (error) throw new AppError("INFRA.DB_ERROR", { cause: error });
      if (!data) throw new AppError("AUTH.FORBIDDEN", { meta: { permission: code, scope, scopeId } });
      return next();
    });
}

/** Emits structured request logs at the boundary. */
export const auditRequest = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const started = Date.now();
    try {
      const r = await next();
      slog.info("request.ok", { userId: context.userId, durationMs: Date.now() - started });
      return r;
    } catch (e) {
      slog.error("request.err", { userId: context.userId, durationMs: Date.now() - started, err: String(e) });
      throw e;
    }
  });
