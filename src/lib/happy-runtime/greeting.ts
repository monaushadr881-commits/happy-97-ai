/**
 * R39 HAPPY Runtime — Greeting Runtime.
 *
 * Context-aware greetings. Templates live in `happy_greeting_templates`.
 * Nothing is hardcoded per user: greetings are composed from
 *   locale + audience + channel + time-of-day
 * and rendered via a tiny `{{var}}` substitution over context vars.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HappyAudience, HappyChannel } from "./session";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night" | "any";

export type GreetingContext = {
  locale: string;
  audience: HappyAudience;
  channel: HappyChannel;
  now?: Date;
  user_name?: string;
  company?: string;
  briefing_summary?: string;
  extra?: Record<string, string>;
};

export type ResolvedGreeting = {
  template_id: string | null;
  template: string | null;
  text: string;
  locale: string;
  time_of_day: TimeOfDay;
  audience: HappyAudience;
  channel: HappyChannel;
  fallback: boolean;
};

export function timeOfDayFor(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

function render(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_m, k) => {
    const v = vars[k as keyof typeof vars];
    return v == null ? "" : String(v);
  }).replace(/\s{2,}/g, " ").trim();
}

/**
 * Resolve the best matching greeting template with a deterministic
 * specificity score:
 *   +8 exact locale, +2 locale root
 *   +4 audience match, +4 channel match
 *   +2 time_of_day match (not 'any')
 *   +priority
 * Falls back to a generic "Hello, I'm HAPPY" message if nothing matches.
 */
export async function resolveGreeting(
  supabase: SupabaseClient,
  ctx: GreetingContext,
): Promise<ResolvedGreeting> {
  const now = ctx.now ?? new Date();
  const tod = timeOfDayFor(now);
  const localeRoot = ctx.locale.split("-")[0];

  const { data: rows, error } = await supabase
    .from("happy_greeting_templates")
    .select("id, key, locale, audience, channel, time_of_day, template, priority, enabled")
    .eq("enabled", true);

  const vars: Record<string, string | undefined> = {
    user_name: ctx.user_name ?? "there",
    company: ctx.company ?? "H.P PRIVATE LIMITED",
    briefing_summary: ctx.briefing_summary ?? "",
    ...(ctx.extra ?? {}),
  };

  if (error || !rows || rows.length === 0) {
    return {
      template_id: null, template: null,
      text: render("Hello, I'm HAPPY, the AI employee of {{company}}. How can I help?", vars),
      locale: ctx.locale, time_of_day: tod, audience: ctx.audience, channel: ctx.channel, fallback: true,
    };
  }

  type Row = typeof rows[number];
  const scored = rows.map((r: Row) => {
    let s = 0;
    if (r.locale === ctx.locale) s += 8;
    else if (r.locale === localeRoot) s += 2;
    else return { r, s: -1 };
    if (r.audience && r.audience === ctx.audience) s += 4;
    else if (r.audience) return { r, s: -1 };
    if (r.channel && r.channel === ctx.channel) s += 4;
    else if (r.channel) return { r, s: -1 };
    if (r.time_of_day && r.time_of_day !== "any") {
      if (r.time_of_day === tod) s += 2;
      else return { r, s: -1 };
    }
    s += r.priority ?? 0;
    return { r, s };
  }).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s);

  if (scored.length === 0) {
    return {
      template_id: null, template: null,
      text: render("Hello, I'm HAPPY, the AI employee of {{company}}. How can I help?", vars),
      locale: ctx.locale, time_of_day: tod, audience: ctx.audience, channel: ctx.channel, fallback: true,
    };
  }
  const best = scored[0].r;
  return {
    template_id: best.id,
    template: best.template,
    text: render(best.template, vars),
    locale: best.locale,
    time_of_day: (best.time_of_day as TimeOfDay) ?? "any",
    audience: ctx.audience,
    channel: ctx.channel,
    fallback: false,
  };
}
