/**
 * R39–R50 HAPPY Runtime — server functions.
 *
 * Real, callable endpoints. Each one is honest about what it can and can't do.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultPersona, HAPPY_PERSONAS, isPersona } from "./personas";
import { routeCapability, getRegisteredRoutes } from "./capability-router";
import { availableVoiceProviders, synthesizeSpeech, type VoiceProvider } from "./voice";
import { digitalHumanReadiness } from "./digital-human";

const RouteCapabilityInput = z.object({
  capability: z.string().min(1),
  args: z.record(z.string(), z.unknown()).optional(),
  company_id: z.string().uuid().optional(),
  persona: z.string().optional(),
});

export const invokeCapability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof RouteCapabilityInput>) => RouteCapabilityInput.parse(d))
  .handler(async ({ data, context }) => {
    const persona = data.persona && isPersona(data.persona) ? data.persona : undefined;
    const r = await routeCapability(context.supabase, {
      capability: data.capability,
      args: data.args,
      companyId: data.company_id,
      persona,
    });
  });

const SynthesizeInput = z.object({
  provider: z.enum(["lovable", "openai", "gemini", "elevenlabs"]),
  voice_id: z.string().min(1),
  text: z.string().min(1).max(5000),
  language: z.string().optional(),
  format: z.enum(["mp3", "wav", "opus"]).optional(),
});

/**
 * Synthesize speech. Returns base64 audio so the RPC stays JSON-serializable.
 * For raw-audio streaming or `Content-Type: audio/*` responses, use a server
 * route under `/api/public/*` instead.
 */
export const synthesizeVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SynthesizeInput>) => SynthesizeInput.parse(d))
  .handler(async ({ data }) => {
    const result = await synthesizeSpeech({
      provider: data.provider as VoiceProvider,
      voice_id: data.voice_id,
      text: data.text,
      language: data.language,
      format: data.format,
    });
    if (!result.ok) {
      return { ok: false as const, provider: data.provider, error: result.error, status: result.status };
    }
    // Base64-encode the audio
    const bytes = new Uint8Array(result.audio);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    return {
      ok: true as const,
      provider: result.provider,
      content_type: result.content_type,
      audio_base64: b64,
      byte_length: bytes.byteLength,
    };
  });

export const runtimeReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: skills }, { data: deployments }] = await Promise.all([
      context.supabase.from("happy_skills").select("skill_code, runtime_route, enabled"),
      context.supabase.from("happy_deployments").select("channel, status, version_id"),
    ]);
    const voiceProviders = availableVoiceProviders();
    const registeredAdapters = getRegisteredRoutes();
    const dh = digitalHumanReadiness();
    const enabledSkills = (skills ?? []).filter((s) => s.enabled);
    const missingAdapters = enabledSkills
      .filter((s) => !registeredAdapters.includes(s.runtime_route))
      .map((s) => s.runtime_route);

    return {
      fact: {
        personas_available: HAPPY_PERSONAS,
        skills_enabled: enabledSkills.length,
        adapters_registered: registeredAdapters.length,
        adapters_missing: missingAdapters,
        voice_providers: voiceProviders,
        deployments: deployments ?? [],
        digital_human: dh,
      },
      recommendation: {
        note:
          missingAdapters.length > 0
            ? `Register runtime adapters for: ${missingAdapters.join(", ")}`
            : dh.provisioned
              ? "Runtime seams satisfied."
              : "Runtime seams ready. Provision digital-human assets to enable rendering.",
      },
    };
  });

const SelectPersonaInput = z.object({
  audience: z.enum(["founder", "employee", "customer", "visitor", "student"]),
  channel: z.enum(["website", "mobile", "desktop", "presentation", "reception", "meeting", "training"]),
  language: z.string().default("en"),
});

export const selectPersona = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SelectPersonaInput>) => SelectPersonaInput.parse(d))
  .handler(async ({ data, context }) => {
    const persona = defaultPersona(data.audience, data.channel);
    const { data: behavior } = await context.supabase
      .from("happy_behavior")
      .select("mode, system_prompt")
      .eq("mode", persona)
      .maybeSingle();
    return {
      persona,
      audience: data.audience,
      channel: data.channel,
      language: data.language,
      behavior: behavior ?? null,
    };
  });
