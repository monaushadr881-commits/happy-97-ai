/**
 * HAPPY X — Service Layer: Cache
 *
 * Pluggable cache interface. Default backend is in-memory with TTL.
 * Swap for Redis / Cloudflare KV in the future without touching services.
 */

export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  del(key: string): Promise<void>;
  wrap<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T>;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache implements Cache {
  private store = new Map<string, Entry<unknown>>();

  async get<T>(key: string): Promise<T | undefined> {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e.value as T;
  }

  async set<T>(key: string, value: T, ttlMs = 60_000): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async wrap<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const hit = await this.get<T>(key);
    if (hit !== undefined) return hit;
    const v = await loader();
    await this.set(key, v, ttlMs);
    return v;
  }
}

export const memoryCache: Cache = new MemoryCache();
