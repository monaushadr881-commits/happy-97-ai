/**
 * Voice adapters (STT + TTS + Realtime) — plug into the ONE HAPPY voice runtime.
 * Reuses src/lib/happy-r83/voice-fallback.ts and src/routes/api/happy-stt.ts.
 * No duplicate voice runtime is created here.
 */
import { AdapterStatus, checkEnv, AdapterNotConfiguredError, env } from "../types";

export type VoiceKind = "stt" | "tts" | "realtime";
export interface VoiceAdapter {
  id: string;
  kinds: VoiceKind[];
  isConfigured(): boolean;
  transcribe?(audio: ArrayBuffer, mime: string): Promise<{ text: string }>;
  synthesize?(text: string, voice?: string): Promise<{ audio: ArrayBuffer; mime: string }>;
  openRealtime?(): Promise<{ close(): void }>;
}

function guard(id: string, envs: string[]) {
  const c = checkEnv(envs);
  if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing);
}

export const openaiRealtime: VoiceAdapter = {
  id: "voice.openai_realtime",
  kinds: ["stt", "tts", "realtime"],
  isConfigured: () => checkEnv(["OPENAI_API_KEY"]).configured,
  async openRealtime() { guard(this.id, ["OPENAI_API_KEY"]); throw new Error("realtime WS not wired in-repo"); },
};
export const azureSpeech: VoiceAdapter = {
  id: "voice.azure_speech",
  kinds: ["stt", "tts"],
  isConfigured: () => checkEnv(["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"]).configured,
  async transcribe() { guard(this.id, ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"]); throw new Error("Azure SDK not bundled"); },
  async synthesize() { guard(this.id, ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"]); throw new Error("Azure SDK not bundled"); },
};
export const googleSpeech: VoiceAdapter = {
  id: "voice.google_speech",
  kinds: ["stt", "tts"],
  isConfigured: () => checkEnv(["GOOGLE_SPEECH_API_KEY"]).configured,
  async transcribe() { guard(this.id, ["GOOGLE_SPEECH_API_KEY"]); throw new Error("Google Speech client not bundled"); },
  async synthesize() { guard(this.id, ["GOOGLE_SPEECH_API_KEY"]); throw new Error("Google Speech client not bundled"); },
};
export const elevenlabs: VoiceAdapter = {
  id: "voice.elevenlabs",
  kinds: ["tts"],
  isConfigured: () => checkEnv(["ELEVENLABS_API_KEY"]).configured,
  async synthesize(text, voice = "Rachel") {
    guard(this.id, ["ELEVENLABS_API_KEY"]);
    const key = env("ELEVENLABS_API_KEY")!;
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`, {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5" }),
    });
    if (!r.ok) throw new Error(`elevenlabs ${r.status}: ${await r.text()}`);
    return { audio: await r.arrayBuffer(), mime: "audio/mpeg" };
  },
};
export const cartesia: VoiceAdapter = {
  id: "voice.cartesia",
  kinds: ["tts", "realtime"],
  isConfigured: () => checkEnv(["CARTESIA_API_KEY"]).configured,
  async synthesize() { guard(this.id, ["CARTESIA_API_KEY"]); throw new Error("cartesia HTTP client not wired"); },
};
export const deepgram: VoiceAdapter = {
  id: "voice.deepgram",
  kinds: ["stt", "realtime"],
  isConfigured: () => checkEnv(["DEEPGRAM_API_KEY"]).configured,
  async transcribe(audio, mime) {
    guard(this.id, ["DEEPGRAM_API_KEY"]);
    const key = env("DEEPGRAM_API_KEY")!;
    const r = await fetch("https://api.deepgram.com/v1/listen", {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "content-type": mime },
      body: audio,
    });
    if (!r.ok) throw new Error(`deepgram ${r.status}: ${await r.text()}`);
    const j: any = await r.json();
    return { text: j?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "" };
  },
};
export const assemblyai: VoiceAdapter = {
  id: "voice.assemblyai",
  kinds: ["stt"],
  isConfigured: () => checkEnv(["ASSEMBLYAI_API_KEY"]).configured,
  async transcribe() { guard(this.id, ["ASSEMBLYAI_API_KEY"]); throw new Error("assemblyai upload flow not wired"); },
};
export const whisper: VoiceAdapter = {
  id: "voice.whisper",
  kinds: ["stt"],
  isConfigured: () => checkEnv(["OPENAI_API_KEY"]).configured,
  async transcribe(audio, mime) {
    guard(this.id, ["OPENAI_API_KEY"]);
    const key = env("OPENAI_API_KEY")!;
    const fd = new FormData();
    fd.append("file", new Blob([audio], { type: mime }), "audio");
    fd.append("model", "whisper-1");
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
    });
    if (!r.ok) throw new Error(`whisper ${r.status}: ${await r.text()}`);
    const j: any = await r.json();
    return { text: j.text ?? "" };
  },
};

export const registry: Record<string, VoiceAdapter> = {
  openaiRealtime, azureSpeech, googleSpeech, elevenlabs, cartesia, deepgram, assemblyai, whisper,
};

export function readiness(): AdapterStatus[] {
  const envsFor: Record<string, string[]> = {
    "voice.openai_realtime": ["OPENAI_API_KEY"],
    "voice.azure_speech": ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"],
    "voice.google_speech": ["GOOGLE_SPEECH_API_KEY"],
    "voice.elevenlabs": ["ELEVENLABS_API_KEY"],
    "voice.cartesia": ["CARTESIA_API_KEY"],
    "voice.deepgram": ["DEEPGRAM_API_KEY"],
    "voice.assemblyai": ["ASSEMBLYAI_API_KEY"],
    "voice.whisper": ["OPENAI_API_KEY"],
  };
  return Object.values(registry).map((a) => ({ id: a.id, ...checkEnv(envsFor[a.id] ?? []) }));
}

/** First configured adapter for a given kind — feeds the existing HAPPY runtime. */
export function pickFor(kind: VoiceKind): VoiceAdapter | null {
  for (const a of Object.values(registry)) if (a.kinds.includes(kind) && a.isConfigured()) return a;
  return null;
}
