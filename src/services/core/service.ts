/**
 * HAPPY X — Service Layer: Base Service
 *
 * `defineService` binds a service name, gives every method structured
 * logging, timing, and centralized error normalization. Services are
 * stateless factories that take a ServiceContext.
 */

import { slog } from "./logger";
import { toAppError, AppError } from "./errors";
import type { ServiceContext } from "./context";

export interface ServiceMeta {
  name: string;
  version?: string;
}

export type ServiceMethod<Args extends unknown[], R> = (ctx: ServiceContext, ...args: Args) => Promise<R>;

export function defineService<T extends Record<string, ServiceMethod<never[], unknown>>>(
  meta: ServiceMeta,
  build: () => T,
): T & { __meta: ServiceMeta } {
  const raw = build();
  const wrapped = {} as Record<string, unknown>;
  for (const [key, fn] of Object.entries(raw)) {
    wrapped[key] = async (ctx: ServiceContext, ...args: unknown[]) => {
      const started = Date.now();
      const action = `${meta.name}.${key}`;
      try {
        const out = await (fn as (c: ServiceContext, ...a: unknown[]) => Promise<unknown>)(ctx, ...args);
        slog.debug("service.ok", {
          service: meta.name, action, traceId: ctx.trace.traceId, userId: ctx.userId,
          companyId: ctx.tenant?.companyId, durationMs: Date.now() - started,
        });
        return out;
      } catch (e) {
        const err = toAppError(e);
        slog.warn("service.err", {
          service: meta.name, action, traceId: ctx.trace.traceId, userId: ctx.userId,
          companyId: ctx.tenant?.companyId, durationMs: Date.now() - started,
          code: err.code, message: err.message,
        });
        throw err;
      }
    };
  }
  (wrapped as { __meta: ServiceMeta }).__meta = meta;
  return wrapped as T & { __meta: ServiceMeta };
}

export { AppError };
