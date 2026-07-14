/**
 * HAPPY X Kernel — Notification Engine (in-app surface)
 *
 * Lightweight toast host wired to the kernel event bus. Any module can call
 * `notify(...)` — no direct coupling to this file required.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { eventBus } from "./event-bus";

export type NotificationLevel = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  level: NotificationLevel;
  title: string;
  description?: string;
  createdAt: number;
}

interface Ctx {
  notifications: Notification[];
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<Ctx | null>(null);

export function notify(input: { level?: NotificationLevel; title: string; description?: string }) {
  eventBus.emit("notification:emit", {
    id: crypto.randomUUID(),
    level: input.level ?? "info",
    title: input.title,
    description: input.description,
  });
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    return eventBus.on("notification:emit", (p) => {
      const n: Notification = { ...p, createdAt: Date.now() };
      setItems((prev) => [...prev, n]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== n.id)), 5000);
    });
  }, []);

  const dismiss = (id: string) => setItems((prev) => prev.filter((n) => n.id !== id));

  return (
    <NotificationContext.Provider value={{ notifications: items, dismiss }}>
      {children}
      <NotificationHost items={items} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}

const LEVEL_STYLES: Record<NotificationLevel, string> = {
  info: "border-gold/25 bg-obsidian/90 text-paper",
  success: "border-emerald-400/40 bg-obsidian/90 text-paper",
  warning: "border-amber-300/40 bg-obsidian/90 text-paper",
  error: "border-rose-400/50 bg-obsidian/90 text-paper",
};

function NotificationHost({ items, onDismiss }: { items: Notification[]; onDismiss: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-3">
      {items.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all ${LEVEL_STYLES[n.level]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{n.title}</p>
              {n.description ? <p className="mt-1 text-xs text-soft-gray">{n.description}</p> : null}
            </div>
            <button
              onClick={() => onDismiss(n.id)}
              className="text-xs text-soft-gray hover:text-paper"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
