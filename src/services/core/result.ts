/**
 * HAPPY X — Service Layer: Result type
 *
 * Structured response envelope returned by every application service.
 * Server functions may throw AppError for HTTP-style failure paths, but
 * internal service composition prefers Result for explicit branching.
 */

export type Ok<T> = { ok: true; data: T };
export type Err<E = ServiceError> = { ok: false; error: E };
export type Result<T, E = ServiceError> = Ok<T> | Err<E>;

export interface ServiceError {
  code: string;
  message: string;
  developerMessage?: string;
  cause?: unknown;
  meta?: Record<string, unknown>;
}

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = <E extends ServiceError>(error: E): Err<E> => ({ ok: false, error });

export function unwrap<T>(r: Result<T>): T {
  if (r.ok) return r.data;
  const e = new Error(r.error.message);
  (e as Error & { code?: string }).code = r.error.code;
  throw e;
}
