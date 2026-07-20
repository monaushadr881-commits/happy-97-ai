/**
 * R272 — Canonical hook every /builder/* shell uses to wire onSend to the
 * canonical pipeline. Reuses the single canonical entry
 * `submitBuilderPrompt` — no duplicate handlers, no direct fetch.
 */
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  submitBuilderPrompt,
  type BuilderSubmitResult,
} from "@/lib/builder/builder-submit.functions";

export interface UseBuilderPromptOptions {
  surface: string;
  onLog?: (kind: "log", text: string) => void;
}

export function useBuilderPrompt(opts: UseBuilderPromptOptions) {
  const fn = useServerFn(submitBuilderPrompt);
  const [pending, setPending] = React.useState(false);

  const submit = React.useCallback(
    async (preset: string, prompt: string, attachments = 0): Promise<BuilderSubmitResult | null> => {
      const trimmed = (prompt ?? "").trim();
      if (!trimmed) {
        toast.error("Prompt is empty.");
        return null;
      }
      setPending(true);
      try {
        const res = await fn({
          data: { surface: opts.surface, preset, prompt: trimmed, attachments },
        });
        toast.success(`HAPPY accepted · ${preset}`);
        opts.onLog?.(
          "log",
          `Pipeline · audit ${res.audit_id.slice(0, 8)}${res.session_id ? ` · session ${res.session_id.slice(0, 8)}` : ""}`,
        );
        return res;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(`HAPPY failed · ${msg}`);
        opts.onLog?.("log", `Pipeline failed · ${msg}`);
        return null;
      } finally {
        setPending(false);
      }
    },
    [fn, opts],
  );

  return { submit, pending };
}
