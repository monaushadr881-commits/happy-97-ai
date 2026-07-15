/**
 * ShellContext — R20 Enterprise Shell
 * Central state for the universal shell: command palette open state,
 * HAPPY floating assistant visibility, and pinned/favorites (localStorage).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const PIN_KEY = "happyx.shell.pins.v1";

interface ShellCtx {
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  happyOpen: boolean;
  toggleHappy: () => void;
  pins: string[];
  togglePin: (route: string) => void;
  isPinned: (route: string) => boolean;
}

const ShellContext = createContext<ShellCtx | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [happyOpen, setHappyOpen] = useState(false);
  const [pins, setPins] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PIN_KEY);
      if (raw) setPins(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PIN_KEY, JSON.stringify(pins));
    } catch {
      /* noop */
    }
  }, [pins]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (meta && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setHappyOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const togglePin = useCallback((route: string) => {
    setPins((prev) => (prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]));
  }, []);

  const value = useMemo<ShellCtx>(
    () => ({
      paletteOpen,
      openPalette: () => setPaletteOpen(true),
      closePalette: () => setPaletteOpen(false),
      togglePalette: () => setPaletteOpen((v) => !v),
      happyOpen,
      toggleHappy: () => setHappyOpen((v) => !v),
      pins,
      togglePin,
      isPinned: (r: string) => pins.includes(r),
    }),
    [paletteOpen, happyOpen, pins, togglePin]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <ShellProvider>");
  return ctx;
}
