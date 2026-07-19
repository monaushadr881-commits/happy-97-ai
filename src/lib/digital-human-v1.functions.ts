/**
 * HAPPY X — Digital Human OS API v1 (server functions)
 *
 * The complete backend surface for HDHOS. HAPPY is the single digital-human
 * identity. `mode` is a capability, never a separate character.
 *
 * Rules:
 *   - Every function goes through `requireSupabaseAuth`.
 *   - RLS on `dh_sessions / dh_preferences / dh_presentations` scopes rows.
 *   - The only AI path is the Lovable AI Gateway. No provider is called
 *     directly. Never expose LOVABLE_API_KEY.
 *   - HAPPY never claims certainty about a user's emotional state.
 *     Emotion adaptation is opt-in via `dh_preferences.emotion_adaptation`.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toAppError } from "@/services/core/errors";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import { z } from "zod";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const adopt = (
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
  module: string,
  capability: string,
  metadata: Record<string, unknown> = {},
) =>
  adoptToCanonicalPipeline(context.supabase, {
    domain: "digital-human",
    module,
    capability,
    user_id: context.userId,
    company_id: ZERO_UUID,
    source: "digital-human-v1",
    metadata,
  });

const uuid = z.string().uuid();
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

// =====================================================================
// MODES — every entry is a HAPPY capability, not a distinct identity
// =====================================================================
export const DH_MODES = [
  "assistant", "teacher", "professor", "mentor", "tutor",
  "business", "coach", "coding", "language", "culture",
  "research", "creator", "enterprise", "founder",
  "presentation", "public_speaker", "interview", "support",
] as const;
export type DhMode = typeof DH_MODES[number];

const MODE_INSTRUCTIONS: Record<DhMode, string> = {
  assistant:      "You are HAPPY, a calm, precise general assistant. Prefer short, action-oriented answers.",
  teacher:        "You are HAPPY in Teacher mode: warm, structured, worked examples, gentle check-ins.",
  professor:      "You are HAPPY in Professor mode: academic rigor, definitions, mechanisms, caveats.",
  mentor:         "You are HAPPY in Mentor mode: ask reflective questions, guide the user to their own answer.",
  tutor:          "You are HAPPY in Tutor mode: diagnose, re-teach simpler, verify with a check question.",
  business:       "You are HAPPY in Business Consultant mode: use crisp frameworks and recommend the next decision.",
  coach:          "You are HAPPY in Career Coach mode: goal → plan → weekly action → measurable outcome.",
  coding:         "You are HAPPY in Coding Mentor mode: minimal runnable examples, complexity notes, one test hint.",
  language:       "You are HAPPY in Language Trainer mode: dialogue snippets, spaced repetition, end with a practice line.",
  culture:        "You are HAPPY in Religion & Culture Guide mode: multiple traditions, respectful, attributed to sources.",
  research:       "You are HAPPY in Research Assistant mode: state assumptions, cite the shape of evidence, flag gaps.",
  creator:        "You are HAPPY in Creator Assistant mode: outlines, hooks, revisions with a single directive style.",
  enterprise:     "You are HAPPY in Enterprise Assistant mode: enterprise-grade, RACI, risk-adjusted, compliance-aware.",
  founder:        "You are HAPPY in Founder Assistant mode: strategic, terse, focused on decisions and second-order effects.",
  presentation:   "You are HAPPY in Presentation mode: speak in short slide-bites, one big idea per beat.",
  public_speaker: "You are HAPPY in Public Speaker mode: rhythmic, memorable phrases, deliberate pauses.",
  interview:      "You are HAPPY in Interview mode: ask one clear question at a time and rate the answer briefly.",
  support:        "You are HAPPY in Customer Support mode: acknowledge, diagnose, resolve, next-step summary.",
};

const IDENTITY = "You are HAPPY — the single Digital Human of HAPPY X. You have many capabilities, but only one identity. Never introduce yourself as another character. Never claim certainty about the user's emotional or mental state; if unsure, ask a short clarifying question.";

// =====================================================================
// PREFERENCES
// =====================================================================
export const dhGetPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("dh_preferences")
      .select("*").eq("user_id", context.userId).maybeSingle();
    if (r.error) throw r.error;
    if (r.data) return r.data;
    // Seed defaults lazily
    const ins = await context.supabase.from("dh_preferences")
      .insert({ user_id: context.userId }).select("*").single();
    if (ins.error) throw ins.error;
    return ins.data;
  }));

const PrefsUpdate = z.object({
  voice: z.string().max(40).optional(),
  language: z.string().max(10).optional(),
  speed: z.number().min(0.5).max(2.0).optional(),
  captions: z.boolean().optional(),
  reduced_motion: z.boolean().optional(),
  high_contrast: z.boolean().optional(),
  large_text: z.boolean().optional(),
  mute_audio: z.boolean().optional(),
  emotion_adaptation: z.boolean().optional(),
  memory_enabled: z.boolean().optional(),
  camera_consent: z.boolean().optional(),
  microphone_consent: z.boolean().optional(),
});
export const dhUpdatePreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PrefsUpdate.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adopt(context, "preferences", "update", { keys: Object.keys(data) });
    const r = await context.supabase.from("dh_preferences")
      .upsert({ user_id: context.userId, ...data, updated_at: new Date().toISOString() })
      .select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// SESSIONS
// =====================================================================
export const dhListSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("dh_sessions")
      .select("id, mode, surface, title, updated_at, created_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const dhGetSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ session_id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("dh_sessions")
      .select("*").eq("id", data.session_id).eq("user_id", context.userId).maybeSingle();
    if (r.error) throw r.error;
    return r.data;
  }));

export const dhDeleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ session_id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("dh_sessions")
      .delete().eq("id", data.session_id).eq("user_id", context.userId);
    if (r.error) throw r.error;
    return { ok: true };
  }));

// =====================================================================
// HAPPY SPEAK — main conversational endpoint (Lovable AI Gateway)
// =====================================================================
type Turn = { role: "user" | "assistant" | "system"; content: string; at: string };

const SpeakInput = z.object({
  mode: z.enum(DH_MODES).default("assistant"),
  surface: z.enum(["conversation", "classroom", "boardroom", "presentation", "whiteboard"]).default("conversation"),
  session_id: uuid.nullable().optional(),
  message: z.string().min(1).max(6000),
  expression_hint: z.enum(["neutral", "smile", "thinking", "explain", "concern", "celebrate"]).optional(),
});

export const dhSpeak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SpeakInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const s = context.supabase;

    const prefsRow = await s.from("dh_preferences")
      .select("emotion_adaptation, memory_enabled, language")
      .eq("user_id", context.userId).maybeSingle();
    const prefs = prefsRow.data ?? { emotion_adaptation: false, memory_enabled: true, language: "en" };

    let sessionId = data.session_id ?? null;
    let transcript: Turn[] = [];
    if (sessionId) {
      const r = await s.from("dh_sessions")
        .select("id, transcript").eq("id", sessionId).eq("user_id", context.userId).maybeSingle();
      if (r.error) throw r.error;
      if (!r.data) throw new Error("Session not found");
      transcript = ((r.data.transcript as Turn[] | null) ?? []);
    } else {
      const ins = await s.from("dh_sessions").insert({
        user_id: context.userId,
        mode: data.mode,
        surface: data.surface,
        title: data.message.slice(0, 80),
        transcript: [],
      }).select("id").single();
      if (ins.error) throw ins.error;
      sessionId = ins.data.id as string;
    }

    const emotionRule = prefs.emotion_adaptation
      ? "The user has opted in to gentle emotional adaptation. Adjust tone warmly but never assert their emotional state."
      : "Do not adapt tone based on assumed emotions. Stay professional and neutral.";

    const messages = [
      { role: "system", content: `${IDENTITY} ${MODE_INSTRUCTIONS[data.mode]} ${emotionRule} Reply in ${prefs.language ?? "en"}. Use short paragraphs suitable for spoken delivery. Avoid tables unless asked.` },
      ...(prefs.memory_enabled ? transcript.slice(-30) : []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.expression_hint ? `[expression:${data.expression_hint}] ${data.message}` : data.message },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
    });
    if (res.status === 429) throw new Error("HAPPY is busy — please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    if (!res.ok) throw new Error(`AI Gateway error: ${res.status}`);
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const answer = (json.choices?.[0]?.message?.content ?? "").trim();

    // Heuristic expression tag for the avatar — never asserts user emotion.
    const expression =
      /\b(great|amazing|congrats|well done|excellent)\b/i.test(answer) ? "celebrate" :
      /\b(sorry|concern|careful|risk|warning)\b/i.test(answer) ? "concern" :
      /\?$/.test(answer.trim()) ? "thinking" : "explain";

    const now = new Date().toISOString();
    const nextTranscript: Turn[] = [
      ...transcript,
      { role: "user" as const, content: data.message, at: now },
      { role: "assistant" as const, content: answer, at: now },
    ].slice(-200);

    const upd = await s.from("dh_sessions").update({
      transcript: nextTranscript,
      mode: data.mode,
      surface: data.surface,
      updated_at: now,
    }).eq("id", sessionId).eq("user_id", context.userId);
    if (upd.error) throw upd.error;

    return { session_id: sessionId, answer, expression, transcript: nextTranscript };
  }));

// =====================================================================
// PRESENTATION AUTHORING (AI-assisted slide deck for HAPPY to present)
// =====================================================================
const GenSlidesInput = z.object({
  title: z.string().min(3).max(160),
  audience: z.string().max(160).optional(),
  outline: z.string().min(5).max(2000),
  slide_count: z.number().int().min(3).max(20).optional(),
});
export const dhGeneratePresentation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GenSlidesInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const count = data.slide_count ?? 8;
    const prompt = `${IDENTITY} You are HAPPY in Presentation mode.
Build a ${count}-slide deck for the audience: ${data.audience ?? "general professional"}.
Title: ${data.title}
Outline: ${data.outline}
Return STRICT JSON in a fenced \`\`\`json block only, matching:
{"slides":[{"title":"...","bullets":["...","..."],"narration":"one short spoken paragraph"}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`AI Gateway error: ${res.status}`);
    const j = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = j.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/```json\s*([\s\S]*?)```/i) ?? raw.match(/(\{[\s\S]*\})/);
    let slides: unknown = [];
    try { slides = JSON.parse((match?.[1] ?? "{}").trim()).slides ?? []; } catch { slides = []; }
    const parsed = z.array(z.object({
      title: z.string().max(200),
      bullets: z.array(z.string().max(300)).max(8).default([]),
      narration: z.string().max(1200).default(""),
    })).max(20).safeParse(slides);
    const cleanSlides = parsed.success ? parsed.data : [];

    const ins = await context.supabase.from("dh_presentations").insert({
      user_id: context.userId,
      title: data.title,
      audience: data.audience ?? null,
      slides: cleanSlides,
      status: "draft",
    }).select("*").single();
    if (ins.error) throw ins.error;
    return ins.data;
  }));

export const dhListPresentations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("dh_presentations")
      .select("id, title, audience, status, updated_at, slides")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const dhDeletePresentation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("dh_presentations")
      .delete().eq("id", data.id).eq("user_id", context.userId);
    if (r.error) throw r.error;
    return { ok: true };
  }));
