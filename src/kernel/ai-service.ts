/**
 * HAPPY X Kernel — AI Service Layer (client facade)
 *
 * Thin wrapper around Lovable AI Gateway calls executed through server
 * functions. Modules import from here so we can swap providers, add retries,
 * or route by capability without touching feature code.
 */

import { eventBus } from "./event-bus";
import { logger } from "./logger";

export interface AiChatRequest {
  module: string;
  system?: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  model?: string;
}

export interface AiChatResponse {
  ok: boolean;
  text: string;
  model: string;
  error?: string;
}

const log = logger.child("ai");

/**
 * Placeholder client-side executor. Concrete implementations live in server
 * functions (see src/lib/happyx-chat.functions.ts). Modules call `runChat`
 * with an async executor injected by the caller so this layer stays free of
 * hard dependencies on any single server function.
 */
export async function runChat(
  request: AiChatRequest,
  executor: (req: AiChatRequest) => Promise<AiChatResponse>,
): Promise<AiChatResponse> {
  const started = performance.now();
  eventBus.emit("ai:request", { module: request.module, prompt: request.messages.at(-1)?.content ?? "" });
  try {
    const res = await executor(request);
    eventBus.emit("ai:response", { module: request.module, ok: res.ok, ms: performance.now() - started });
    if (!res.ok) log.warn("chat failed", { module: request.module, error: res.error });
    return res;
  } catch (err) {
    eventBus.emit("ai:response", { module: request.module, ok: false, ms: performance.now() - started });
    log.error("chat threw", { module: request.module, err: String(err) });
    return { ok: false, text: "", model: request.model ?? "unknown", error: String(err) };
  }
}
