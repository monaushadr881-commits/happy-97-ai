/**
 * HAPPY — Webhook Security Helper (P0.2)
 *
 * HMAC signature verification + replay-guard for every inbound webhook.
 * Runtime: Cloudflare Workers (WebCrypto). No Node-only imports.
 *
 * Contract:
 *   1. Verify HMAC-SHA256 signature over the raw request body using a
 *      shared secret. Constant-time compare.
 *   2. Reject requests where the signed timestamp is outside a tolerance
 *      window (default 5 minutes) — protects against replay of captured
 *      valid payloads.
 *   3. Reject repeated delivery IDs within the tolerance window using an
 *      in-memory sliding cache (best-effort per Worker instance;
 *      providers with at-least-once delivery still get idempotency at
 *      the handler layer).
 *
 * This helper is provider-agnostic. Provider adapters (Stripe, Paddle,
 * Razorpay, …) wrap it with their signature-header parsing.
 */

const encoder = new TextEncoder();

export interface VerifyOptions {
  /** Raw request body as a string (must be the exact bytes signed). */
  body: string;
  /** Signature hex string from the provider header. */
  signature: string;
  /** Shared secret. Never logged. */
  secret: string;
  /** Unix seconds from the signed timestamp header. Optional. */
  timestamp?: number;
  /** Delivery ID for replay-guard. Optional. */
  deliveryId?: string;
  /** Allowed clock skew in seconds. Default 300. */
  toleranceSeconds?: number;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "bad_signature" | "expired" | "replay" | "missing" };

/** HMAC-SHA256 → lowercase hex. */
export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const bytes = new Uint8Array(sig);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

/** Constant-time string equality. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── Replay guard: sliding cache keyed by deliveryId ──────────────────
interface CacheEntry { expiresAt: number }
const seen = new Map<string, CacheEntry>();
const MAX_ENTRIES = 5000;

function prune(now: number): void {
  if (seen.size < MAX_ENTRIES) return;
  for (const [k, v] of seen) if (v.expiresAt <= now) seen.delete(k);
  if (seen.size < MAX_ENTRIES) return;
  const drop = seen.size - MAX_ENTRIES + 100;
  let i = 0;
  for (const k of seen.keys()) { if (i++ >= drop) break; seen.delete(k); }
}

/** Returns true if id was already seen within tolerance; records it otherwise. */
export function isReplay(id: string, toleranceSeconds: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  prune(now);
  const hit = seen.get(id);
  if (hit && hit.expiresAt > now) return true;
  seen.set(id, { expiresAt: now + toleranceSeconds });
  return false;
}

/**
 * Verify HMAC + timestamp window + replay-guard.
 * The signed payload is `${timestamp}.${body}` when timestamp is present,
 * otherwise just `body` — matches Stripe/Paddle conventions.
 */
export async function verifyWebhook(opts: VerifyOptions): Promise<VerifyResult> {
  const { body, signature, secret } = opts;
  const tolerance = opts.toleranceSeconds ?? 300;

  if (!body || !signature || !secret) return { ok: false, reason: "missing" };

  if (opts.timestamp !== undefined) {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - opts.timestamp) > tolerance) return { ok: false, reason: "expired" };
  }

  const signedPayload = opts.timestamp !== undefined ? `${opts.timestamp}.${body}` : body;
  const expected = await hmacSha256Hex(secret, signedPayload);
  if (!timingSafeEqual(expected, signature.toLowerCase())) {
    return { ok: false, reason: "bad_signature" };
  }

  if (opts.deliveryId && isReplay(opts.deliveryId, tolerance)) {
    return { ok: false, reason: "replay" };
  }

  return { ok: true };
}

/** Test-only: clear the replay cache. Never call from request paths. */
export function __resetReplayCacheForTests(): void {
  seen.clear();
}
