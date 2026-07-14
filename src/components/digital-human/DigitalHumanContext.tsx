/**
 * Digital Human context — preferences, activity, expression, posture, gaze.
 * Preferences are server-authoritative (dh_preferences RLS row).
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dhGetPreferences, dhUpdatePreferences } from "@/lib/digital-human-v1.functions";
import type { AvatarActivity, AvatarExpression } from "./HappyAvatar";

export type DhPreferences = {
  voice: string; language: string; speed: number;
  captions: boolean; reduced_motion: boolean; high_contrast: boolean; large_text: boolean;
  mute_audio: boolean; emotion_adaptation: boolean; memory_enabled: boolean;
  camera_consent: boolean; microphone_consent: boolean;
};

export type Posture = "normal" | "presentation";
/** Gaze target in normalized page coordinates: values are pixel offsets from
 *  the avatar's own center. Set null to release. */
export type GazeTarget = { x: number; y: number } | null;

const DEFAULTS: DhPreferences = {
  voice: "alloy", language: "en", speed: 1,
  captions: true, reduced_motion: false, high_contrast: false, large_text: false,
  mute_audio: false, emotion_adaptation: false, memory_enabled: true,
  camera_consent: false, microphone_consent: false,
};

type Ctx = {
  prefs: DhPreferences;
  updatePrefs: (patch: Partial<DhPreferences>) => Promise<void>;
  activity: AvatarActivity;
  setActivity: (a: AvatarActivity) => void;
  expression: AvatarExpression;
  setExpression: (e: AvatarExpression) => void;
  posture: Posture;
  setPosture: (p: Posture) => void;
  gazeTarget: GazeTarget;
  setGazeTarget: (g: GazeTarget) => void;
  /** Momentary look-then-return: pass a target for `holdMs`, then release. */
  glanceAt: (g: GazeTarget, holdMs?: number) => void;
};

const DhCtx = createContext<Ctx | null>(null);

export function DigitalHumanProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["dh", "prefs"], queryFn: () => dhGetPreferences() });
  const prefs = { ...DEFAULTS, ...(q.data ?? {}) } as DhPreferences;
  const [activity, setActivity] = useState<AvatarActivity>("idle");
  const [expression, setExpression] = useState<AvatarExpression>("neutral");
  const [posture, setPosture] = useState<Posture>("normal");
  const [gazeTarget, setGazeTarget] = useState<GazeTarget>(null);
  const glanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const glanceAt = useCallback((g: GazeTarget, holdMs = 1200) => {
    if (glanceRef.current) clearTimeout(glanceRef.current);
    setGazeTarget(g);
    glanceRef.current = setTimeout(() => setGazeTarget(null), holdMs);
  }, []);

  const m = useMutation({
    mutationFn: (patch: Partial<DhPreferences>) => dhUpdatePreferences({ data: patch }),
    onSuccess: (row) => qc.setQueryData(["dh", "prefs"], row),
  });

  const value = useMemo<Ctx>(() => ({
    prefs,
    updatePrefs: async (patch) => { await m.mutateAsync(patch); },
    activity, setActivity, expression, setExpression,
    posture, setPosture, gazeTarget, setGazeTarget, glanceAt,
  }), [prefs, activity, expression, posture, gazeTarget, glanceAt, m]);

  return <DhCtx.Provider value={value}>{children}</DhCtx.Provider>;
}

export function useDigitalHuman() {
  const ctx = useContext(DhCtx);
  if (!ctx) throw new Error("useDigitalHuman must be used inside <DigitalHumanProvider>");
  return ctx;
}
