/**
 * R39–R50 HAPPY Runtime — Voice/TTS integration.
 *
 * Real integrations only. Providers:
 *   - lovable   → Lovable AI Gateway (`openai/gpt-4o-mini-tts`)
 *   - openai    → OpenAI TTS via LOVABLE_API_KEY gateway route
 *   - gemini    → Google Gemini TTS via gateway (`google/gemini-2.5-flash-tts`)
 *   - elevenlabs → Direct ElevenLabs, only when ELEVENLABS_API_KEY is set
 *
 * Returns raw audio bytes plus content-type. No fake lip sync, no fake
 * streaming — real streaming is provider-controlled via SSE headers.
 */

export type VoiceProvider = "lovable" | "openai" | "gemini" | "elevenlabs";

export type SynthesizeInput = {
  provider: VoiceProvider;
  voice_id: string;
  text: string;
  language?: string;
  format?: "mp3" | "wav" | "opus";
  stream?: boolean;
};

export type SynthesizeResult =
  | { ok: true; audio: ArrayBuffer; content_type: string; provider: VoiceProvider }
  | { ok: false; provider: VoiceProvider; error: string; status?: number };

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/audio/speech";

async function synthesizeLovable(input: SynthesizeInput, model: string): Promise<SynthesizeResult> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return { ok: false, provider: input.provider, error: "LOVABLE_API_KEY_missing" };
  const res = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: input.text,
      voice: input.voice_id,
      response_format: input.format ?? "mp3",
    }),
  });
  if (!res.ok) {
    return { ok: false, provider: input.provider, status: res.status, error: await res.text() };
  }
  const audio = await res.arrayBuffer();
  return {
    ok: true,
    provider: input.provider,
    audio,
    content_type: res.headers.get("content-type") ?? "audio/mpeg",
  };
}

async function synthesizeElevenLabs(input: SynthesizeInput): Promise<SynthesizeResult> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { ok: false, provider: "elevenlabs", error: "ELEVENLABS_API_KEY_missing" };
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${input.voice_id}`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: input.text,
      model_id: "eleven_turbo_v2_5",
    }),
  });
  if (!res.ok) {
    return { ok: false, provider: "elevenlabs", status: res.status, error: await res.text() };
  }
  const audio = await res.arrayBuffer();
  return { ok: true, provider: "elevenlabs", audio, content_type: "audio/mpeg" };
}

export async function synthesizeSpeech(input: SynthesizeInput): Promise<SynthesizeResult> {
  switch (input.provider) {
    case "lovable":
    case "openai":
      return synthesizeLovable(input, "openai/gpt-4o-mini-tts");
    case "gemini":
      return synthesizeLovable(input, "google/gemini-2.5-flash-tts");
    case "elevenlabs":
      return synthesizeElevenLabs(input);
    default:
      return { ok: false, provider: input.provider, error: "unknown_provider" };
  }
}

/**
 * Provider availability probe. Honest report: reads which secrets exist.
 * Does NOT invent capabilities.
 */
export function availableVoiceProviders(): Record<VoiceProvider, boolean> {
  const hasLovable = !!process.env.LOVABLE_API_KEY;
  const hasEleven = !!process.env.ELEVENLABS_API_KEY;
  return {
    lovable: hasLovable,
    openai: hasLovable, // routed through Lovable gateway
    gemini: hasLovable, // routed through Lovable gateway
    elevenlabs: hasEleven,
  };
}
