/**
 * R106 — Shared cron/internal request authenticator.
 *
 * Cron endpoints under /api/public/cron/* run with the service-role client
 * (RLS bypass), so they MUST require a server-only shared secret. This helper
 * verifies the `x-cron-secret` header (or `Authorization: Bearer <secret>`)
 * against the CRON_SHARED_SECRET env var using a constant-time compare.
 *
 * Returns `null` on success or a 401/500 Response on failure. Callers should
 * `return unauthorized ?? await run()`.
 */

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function assertCronAuth(request: Request): Response | null {
  const expected = process.env.CRON_SHARED_SECRET;
  if (!expected || expected.length < 16) {
    return new Response(
      JSON.stringify({ error: "cron_secret_not_configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  const headerSecret =
    request.headers.get("x-cron-secret") ??
    (request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  if (!headerSecret || !timingSafeEqualStr(headerSecret, expected)) {
    return new Response(
      JSON.stringify({ error: "unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  return null;
}
