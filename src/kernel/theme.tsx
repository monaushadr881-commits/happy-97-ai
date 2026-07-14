/**
 * HAPPY X Kernel — Theme Manager
 *
 * Ships a single luxury dark theme (Obsidian + Gold) with an escape hatch for
 * future light/high-contrast variants. Persists preference and applies it as
 * a `data-theme` attribute on <html>.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "obsidian" | "platinum" | "high-contrast";

const STORAGE_KEY = "happyx.theme.v1";

interface ThemeCtx {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

function useHydrated(): boolean {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("obsidian");
  const hydrated = useHydrated();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
      if (stored) setThemeState(stored);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = theme;
  }, [theme, hydrated]);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* noop */
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
