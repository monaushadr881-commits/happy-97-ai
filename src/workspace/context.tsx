/**
 * HAPPY OS — Workspace Runtime (R21)
 * Single provider that exposes the workspace engine, memory, active
 * workspace/business selection, recents, favorites, and search history.
 * Tracks route changes to build a live recents list; wires only the UX
 * layer, never touches business logic or RLS.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import { workspaceMemory } from "./memory";
import { BUSINESSES, WORKSPACES, workspaceForRoute, type WorkspaceDef, type BusinessIdentity } from "./registry";

interface WorkspaceCtx {
  activeWorkspace: WorkspaceDef | null;
  setActiveWorkspace: (id: string) => void;
  activeBusiness: BusinessIdentity;
  setActiveBusiness: (id: string) => void;
  recents: string[];
  favorites: string[];
  toggleFavorite: (route: string) => void;
  isFavorite: (route: string) => boolean;
  history: string[];
  pushHistory: (q: string) => void;
  workspaces: readonly WorkspaceDef[];
  businesses: readonly BusinessIdentity[];
}

const WorkspaceContext = createContext<WorkspaceCtx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string>(BUSINESSES[0].id);
  const [recents, setRecents] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  // Hydrate from memory once
  useEffect(() => {
    setActiveWorkspaceId(workspaceMemory.getActiveWorkspace());
    const b = workspaceMemory.getActiveBusiness();
    if (b) setActiveBusinessId(b);
    setRecents(workspaceMemory.getRecents());
    setFavorites(workspaceMemory.getFavorites());
    setHistory(workspaceMemory.getHistory());
  }, []);

  // Track route changes → recents + inferred active workspace
  useEffect(() => {
    if (!pathname) return;
    const ws = workspaceForRoute(pathname);
    if (ws) {
      setActiveWorkspaceId(ws.id);
      workspaceMemory.setActiveWorkspace(ws.id);
    }
    workspaceMemory.pushRecent(pathname);
    setRecents(workspaceMemory.getRecents());
  }, [pathname]);

  const setActiveWorkspace = useCallback((id: string) => {
    setActiveWorkspaceId(id);
    workspaceMemory.setActiveWorkspace(id);
  }, []);

  const setActiveBusiness = useCallback((id: string) => {
    setActiveBusinessId(id);
    workspaceMemory.setActiveBusiness(id);
  }, []);

  const toggleFavorite = useCallback((route: string) => {
    setFavorites(workspaceMemory.toggleFavorite(route));
  }, []);

  const pushHistory = useCallback((q: string) => {
    workspaceMemory.pushHistory(q);
    setHistory(workspaceMemory.getHistory());
  }, []);

  const activeWorkspace = useMemo(
    () => WORKSPACES.find((w) => w.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId]
  );

  const activeBusiness = useMemo(
    () => BUSINESSES.find((b) => b.id === activeBusinessId) ?? BUSINESSES[0],
    [activeBusinessId]
  );

  const value = useMemo<WorkspaceCtx>(
    () => ({
      activeWorkspace,
      setActiveWorkspace,
      activeBusiness,
      setActiveBusiness,
      recents,
      favorites,
      toggleFavorite,
      isFavorite: (r) => favorites.includes(r),
      history,
      pushHistory,
      workspaces: WORKSPACES,
      businesses: BUSINESSES,
    }),
    [activeWorkspace, setActiveWorkspace, activeBusiness, setActiveBusiness, recents, favorites, toggleFavorite, history, pushHistory]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
