/**
 * HAPPY X — Service Layer: Central Error Registry
 *
 * Typed errors with stable codes, localized messages, and developer hints.
 * All services throw AppError (or return Result<E extends ServiceError>).
 */

import type { ServiceError } from "./result";

export const ERROR_CODES = {
  // Auth / Authz
  UNAUTHORIZED: "AUTH.UNAUTHORIZED",
  FORBIDDEN: "AUTH.FORBIDDEN",
  SESSION_EXPIRED: "AUTH.SESSION_EXPIRED",
  // Validation
  VALIDATION_FAILED: "VALIDATION.FAILED",
  INVALID_INPUT: "VALIDATION.INVALID_INPUT",
  // Resource
  NOT_FOUND: "RESOURCE.NOT_FOUND",
  CONFLICT: "RESOURCE.CONFLICT",
  ALREADY_EXISTS: "RESOURCE.ALREADY_EXISTS",
  // Tenancy
  TENANT_MISMATCH: "TENANCY.MISMATCH",
  TENANT_REQUIRED: "TENANCY.REQUIRED",
  // Infra
  DB_ERROR: "INFRA.DB_ERROR",
  UPSTREAM_ERROR: "INFRA.UPSTREAM_ERROR",
  RATE_LIMITED: "INFRA.RATE_LIMITED",
  // AI
  AI_UNAVAILABLE: "AI.UNAVAILABLE",
  AI_CREDITS_EXHAUSTED: "AI.CREDITS_EXHAUSTED",
  // Generic
  INTERNAL: "INTERNAL.UNEXPECTED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  "AUTH.UNAUTHORIZED": "You need to sign in to continue.",
  "AUTH.FORBIDDEN": "You do not have permission to perform this action.",
  "AUTH.SESSION_EXPIRED": "Your session has expired. Please sign in again.",
  "VALIDATION.FAILED": "The information you provided is not valid.",
  "VALIDATION.INVALID_INPUT": "One or more fields are invalid.",
  "RESOURCE.NOT_FOUND": "The requested item could not be found.",
  "RESOURCE.CONFLICT": "This action conflicts with the current state.",
  "RESOURCE.ALREADY_EXISTS": "That already exists.",
  "TENANCY.MISMATCH": "This resource belongs to a different workspace.",
  "TENANCY.REQUIRED": "A company or workspace context is required.",
  "INFRA.DB_ERROR": "A database error occurred.",
  "INFRA.UPSTREAM_ERROR": "An upstream service is unavailable.",
  "INFRA.RATE_LIMITED": "Too many requests. Please slow down.",
  "AI.UNAVAILABLE": "The AI service is temporarily unavailable.",
  "AI.CREDITS_EXHAUSTED": "AI credits are exhausted. Please top up.",
  "INTERNAL.UNEXPECTED": "Something went wrong.",
};

const HTTP_STATUS: Record<ErrorCode, number> = {
  "AUTH.UNAUTHORIZED": 401,
  "AUTH.FORBIDDEN": 403,
  "AUTH.SESSION_EXPIRED": 401,
  "VALIDATION.FAILED": 400,
  "VALIDATION.INVALID_INPUT": 400,
  "RESOURCE.NOT_FOUND": 404,
  "RESOURCE.CONFLICT": 409,
  "RESOURCE.ALREADY_EXISTS": 409,
  "TENANCY.MISMATCH": 403,
  "TENANCY.REQUIRED": 400,
  "INFRA.DB_ERROR": 500,
  "INFRA.UPSTREAM_ERROR": 502,
  "INFRA.RATE_LIMITED": 429,
  "AI.UNAVAILABLE": 503,
  "AI.CREDITS_EXHAUSTED": 402,
  "INTERNAL.UNEXPECTED": 500,
};

export class AppError extends Error implements ServiceError {
  code: ErrorCode;
  developerMessage?: string;
  cause?: unknown;
  meta?: Record<string, unknown>;
  status: number;

  constructor(code: ErrorCode, opts: { message?: string; developerMessage?: string; cause?: unknown; meta?: Record<string, unknown> } = {}) {
    super(opts.message ?? DEFAULT_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
    this.developerMessage = opts.developerMessage;
    this.cause = opts.cause;
    this.meta = opts.meta;
    this.status = HTTP_STATUS[code];
  }

  toJSON(): ServiceError & { status: number } {
    return {
      code: this.code,
      message: this.message,
      developerMessage: this.developerMessage,
      meta: this.meta,
      status: this.status,
    };
  }
}

export const unauthorized = (msg?: string) => new AppError("AUTH.UNAUTHORIZED", { message: msg });
export const forbidden = (msg?: string) => new AppError("AUTH.FORBIDDEN", { message: msg });
export const notFound = (msg?: string) => new AppError("RESOURCE.NOT_FOUND", { message: msg });
export const conflict = (msg?: string) => new AppError("RESOURCE.CONFLICT", { message: msg });
export const validationFailed = (msg?: string, meta?: Record<string, unknown>) =>
  new AppError("VALIDATION.FAILED", { message: msg, meta });
export const tenantMismatch = () => new AppError("TENANCY.MISMATCH");
export const dbError = (cause: unknown) => new AppError("INFRA.DB_ERROR", { cause, developerMessage: String(cause) });

export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  return new AppError("INTERNAL.UNEXPECTED", { cause: e, developerMessage: e instanceof Error ? e.message : String(e) });
}
