/**
 * Canonical read cache — the ONLY cache owner in the repository.
 * TTL + LRU + in-flight promise deduplication.
 *
 * Usage:
 *   const data = await memoryCache.wrap("bi:kpis:v1", 30_000, () => loadKpis());
 *
 * Do NOT create a second cache implementation anywhere.
 */

type Entry<T> = { value: T; expiresAt: number };

class MemoryCache {
  private store = new Map<string, Entry<unknown>>();
  private inflight = new Map<string, Promise<unknown>>();
  private max: number;

  constructor(max = 500) {
    this.max = max;
  }

  get<T>(key: string): T | undefined {
    const hit = this.store.get(key) as Entry<T> | undefined;
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // LRU touch
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.max) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(prefix?: string): void {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }

  async wrap<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const pending = this.inflight.get(key) as Promise<T> | undefined;
    if (pending) return pending;

    const p = (async () => {
      try {
        const value = await loader();
        this.set(key, value, ttlMs);
        return value;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, p);
    return p;
  }

  stats() {
    return { size: this.store.size, inflight: this.inflight.size, max: this.max };
  }
}

export const memoryCache = new MemoryCache(500);
export type { MemoryCache };
