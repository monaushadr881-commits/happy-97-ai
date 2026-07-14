/**
 * HAPPY X — Service Layer: Structured Logger
 *
 * Emits JSON-shaped structured logs with correlation IDs. Wraps the kernel
 * logger; safe on both server and client.
 */

import { logger as kernelLogger } from "@/kernel/logger";

export interface LogContext {
  traceId?: string;
  requestId?: string;
  correlationId?: string;
  userId?: string;
  companyId?: string;
  service?: string;
  action?: string;
  durationMs?: number;
  [k: string]: unknown;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

function emit(level: LogLevel, message: string, ctx?: LogContext) {
  const payload = { ts: new Date().toISOString(), level, message, ...ctx };
  const log = kernelLogger.child(ctx?.service ?? "svc");
  log[level](message, payload);
}

export const slog = {
  debug: (msg: string, ctx?: LogContext) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit("error", msg, ctx),
};

let counter = 0;
export function newTraceId(): string {
  counter = (counter + 1) & 0xffff;
  const rand = Math.random().toString(36).slice(2, 10);
  return `t_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}
