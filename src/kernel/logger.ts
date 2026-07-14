/**
 * HAPPY X Kernel — Structured Logger
 *
 * Level-aware, scoped, JSON-friendly logger. Safe on server and client.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  debug: (msg: string, ctx?: Record<string, unknown>) => void;
  info: (msg: string, ctx?: Record<string, unknown>) => void;
  warn: (msg: string, ctx?: Record<string, unknown>) => void;
  error: (msg: string, ctx?: Record<string, unknown>) => void;
  child: (scope: string) => Logger;
}

const globalLevel: LogLevel =
  (typeof process !== "undefined" && (process.env?.HAPPYX_LOG_LEVEL as LogLevel)) ||
  (import.meta.env?.DEV ? "debug" : "info");

function shouldLog(level: LogLevel) {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[globalLevel];
}

function emit(level: LogLevel, scope: string, msg: string, ctx?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const record = {
    ts: new Date().toISOString(),
    level,
    scope,
    msg,
    ...(ctx ?? {}),
  };
  const line = `[${record.ts}] ${level.toUpperCase()} (${scope}) ${msg}`;
  // eslint-disable-next-line no-console
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (ctx && Object.keys(ctx).length > 0) fn(line, record);
  else fn(line);
}

export function createLogger(scope = "happyx"): Logger {
  return {
    debug: (m, c) => emit("debug", scope, m, c),
    info: (m, c) => emit("info", scope, m, c),
    warn: (m, c) => emit("warn", scope, m, c),
    error: (m, c) => emit("error", scope, m, c),
    child: (sub) => createLogger(`${scope}:${sub}`),
  };
}

export const logger = createLogger("kernel");
