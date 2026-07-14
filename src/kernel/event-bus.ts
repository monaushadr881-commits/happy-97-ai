/**
 * HAPPY X Kernel — Event Bus
 *
 * Type-safe pub/sub for cross-module coordination. Zero dependencies, SSR-safe,
 * synchronous fan-out with isolated error handling per subscriber.
 */

export type KernelEventMap = {
  "auth:signed_in": { userId: string };
  "auth:signed_out": Record<string, never>;
  "workspace:switched": { workspaceId: string; companyId: string };
  "notification:emit": {
    id: string;
    level: "info" | "success" | "warning" | "error";
    title: string;
    description?: string;
  };
  "ai:request": { module: string; prompt: string };
  "ai:response": { module: string; ok: boolean; ms: number };
  "module:activated": { moduleId: string };
  "module:deactivated": { moduleId: string };
  "feature-flag:changed": { key: string; enabled: boolean };
  "audit:event": { action: string; entity?: string; entityId?: string; meta?: Record<string, unknown> };
};

type Listener<E extends keyof KernelEventMap> = (payload: KernelEventMap[E]) => void;

export interface EventBus {
  on<E extends keyof KernelEventMap>(event: E, listener: Listener<E>): () => void;
  once<E extends keyof KernelEventMap>(event: E, listener: Listener<E>): () => void;
  emit<E extends keyof KernelEventMap>(event: E, payload: KernelEventMap[E]): void;
  clear(): void;
}

export function createEventBus(): EventBus {
  const listeners = new Map<keyof KernelEventMap, Set<Listener<never>>>();

  return {
    on(event, listener) {
      const set = (listeners.get(event) ?? new Set()) as Set<Listener<never>>;
      set.add(listener as Listener<never>);
      listeners.set(event, set);
      return () => set.delete(listener as Listener<never>);
    },
    once(event, listener) {
      const off = this.on(event, (payload) => {
        off();
        listener(payload);
      });
      return off;
    },
    emit(event, payload) {
      const set = listeners.get(event);
      if (!set) return;
      for (const l of set) {
        try {
          (l as Listener<typeof event>)(payload);
        } catch (err) {
          // Never let one subscriber break others.
          // eslint-disable-next-line no-console
          console.error(`[kernel:event-bus] listener for "${String(event)}" threw`, err);
        }
      }
    },
    clear() {
      listeners.clear();
    },
  };
}

export const eventBus = createEventBus();
