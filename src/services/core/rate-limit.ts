/**
 * HAPPY X — Service Layer: Rate Limiter
 *
 * In-memory token-bucket. Sufficient for single-worker use; swap for a
 * durable store (Cloudflare KV, Upstash) when needed. Keyed by user + action.
 */

import { AppError } from "./errors";

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  capacity: number;   // max tokens
  refillPerSec: number;
}

export function checkRateLimit(key: string, opts: RateLimitOptions): void {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: now };
  const elapsed = (now - b.updatedAt) / 1000;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec);
  b.updatedAt = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    throw new AppError("INFRA.RATE_LIMITED", {
      meta: { key, retryAfterSec: Math.ceil((1 - b.tokens) / opts.refillPerSec) },
    });
  }
  b.tokens -= 1;
  buckets.set(key, b);
}
