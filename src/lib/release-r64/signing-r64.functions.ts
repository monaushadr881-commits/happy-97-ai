/** R64.4 — Signing profile registry. Metadata only. Never stores key material. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOpsAdminR64, writeAudit } from "./gate";

const REQUIRED_ENV: Record<string, string[]> = {
  android: ["ANDROID_KEYSTORE_ALIAS", "ANDROID_KEYSTORE_PATH"],
  ios: ["APPLE_TEAM_ID", "APPLE_SIGNING_IDENTITY"],
  windows: ["WINDOWS_SIGNING_CERT_THUMBPRINT"],
  macos: ["APPLE_TEAM_ID", "APPLE_NOTARY_APPLE_ID"],
  linux: [],
  web: [],
};

export const listSigningProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const { data, error } = await sb.from("release_signing_profiles").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { profiles: data ?? [] };
  });

export const upsertSigningProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      id: z.string().uuid().optional(),
      platform: z.string().min(1),
      label: z.string().min(1).max(128),
      cert_fingerprint: z.string().optional().nullable(),
      cert_expires_at: z.string().optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional(),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "upsertSigningProfile", source: "api", module: "release.signing.upsertSigningProfile" });
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const payload: any = {
      platform: data.platform,
      label: data.label,
      cert_fingerprint: data.cert_fingerprint ?? null,
      cert_expires_at: data.cert_expires_at ?? null,
      metadata: data.metadata ?? {},
    };
    if (data.id) {
      const { error } = await sb.from("release_signing_profiles").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb.from("release_signing_profiles").insert(payload);
      if (error) throw new Error(error.message);
    }
    await writeAudit(context, { category: "release", action: "signing_profile_upsert", metadata: { platform: data.platform } });
    return { ok: true };
  });

export const checkSigningReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ platform: z.string() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const required = REQUIRED_ENV[data.platform.toLowerCase()] ?? [];
    const missing = required.filter((k) => !process.env[k]);
    return {
      platform: data.platform,
      ready: missing.length === 0,
      required_env: required,
      missing,
      note: "Only env-var presence is checked. Private key material is never read by the runtime.",
    };
  });
