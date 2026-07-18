/**
 * Shared bearer-token authentication + rate limit gate for public API routes
 * that proxy the paid Lovable AI Gateway. Extracted from `dh.tts.ts` so the
 * same guard can be applied to `/api/happy-chat` and `/api/happy-stt`.
 */
import { checkRateLimit } from "@/services/core/rate-limit";
import { AppError } from "@/services/core/errors";

function decodeJwtSub(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { sub?: string; exp?: number };
    if (!payload.sub) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

function jsonError(status: number, error: string, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
  });
}

/**
 * Verify a Supabase bearer token by calling `/auth/v1/user`. Returns the
 * verified user id or a ready-to-return Response on failure.
 */
export async function requireSupabaseUser(request: Request): Promise<{ userId: string } | Response> {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return jsonError(401, "unauthorized");
  const token = authHeader.slice(7).trim();
  const sub = decodeJwtSub(token);
  if (!sub) return jsonError(401, "unauthorized");

  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) return jsonError(500, "server_misconfigured");

  const check = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  });
  if (!check.ok) return jsonError(401, "unauthorized");
  return { userId: sub };
}

/**
 * Apply a per-user token-bucket rate limit. Returns a 429 Response when the
 * limit is exceeded, or null when the request should proceed.
 */
export function enforceRateLimit(
  bucket: string,
  opts: { capacity: number; refillPerSec: number },
): Response | null {
  try {
    checkRateLimit(bucket, opts);
    return null;
  } catch (e) {
    if (e instanceof AppError && e.code === "INFRA.RATE_LIMITED") {
      return jsonError(429, "rate_limited", { "Retry-After": "5" });
    }
    throw e;
  }
}
