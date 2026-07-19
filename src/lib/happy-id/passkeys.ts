/**
 * R157 — Passkey (WebAuthn) policy helpers. Pure, no I/O.
 *
 * Extends HAPPY ID (canonical owner: `src/lib/happy-id.functions.ts`).
 * NO duplicate auth runtime. Browser-side `navigator.credentials.*` calls
 * are triggered by the app; this module resolves the surrounding policy
 * (capability probes, authenticator classification, backup requirements,
 * recovery decisions) that both the client hook and server fns consume.
 */

export const PASSKEY_AUTHENTICATOR_TYPES = ["platform", "cross-platform", "security_key"] as const;
export type PasskeyAuthenticatorType = (typeof PASSKEY_AUTHENTICATOR_TYPES)[number];

export const PASSKEY_TRANSPORTS = ["internal", "hybrid", "usb", "nfc", "ble"] as const;
export type PasskeyTransport = (typeof PASSKEY_TRANSPORTS)[number];

export const PASSKEY_PLATFORMS = ["windows_hello", "touch_id", "face_id", "android_biometric", "security_key", "other"] as const;
export type PasskeyPlatform = (typeof PASSKEY_PLATFORMS)[number];

/** Passkey record shape (mirrors `public.auth_passkeys`). */
export interface PasskeyRow {
  id: string;
  credential_id: string;
  label: string;
  authenticator_type: PasskeyAuthenticatorType;
  transports?: PasskeyTransport[] | null;
  is_backup: boolean;
  last_used_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
}

/** WebAuthn support probe. Safe to call in SSR (returns false). */
export function passkeysSupported(): boolean {
  return typeof window !== "undefined"
    && !!(window as unknown as { PublicKeyCredential?: unknown }).PublicKeyCredential;
}

/** Detect the likely platform authenticator from the current UA. */
export function detectPasskeyPlatform(ua: string = typeof navigator !== "undefined" ? navigator.userAgent : ""): PasskeyPlatform {
  if (/Windows/i.test(ua)) return "windows_hello";
  if (/iPhone|iPad|iOS/i.test(ua)) return "face_id";
  if (/Mac OS X/i.test(ua)) return "touch_id";
  if (/Android/i.test(ua)) return "android_biometric";
  return "other";
}

/** Classify a raw `AuthenticatorAttachment` string. */
export function classifyAuthenticator(
  attachment: string | null | undefined,
  transports: readonly string[] = [],
): PasskeyAuthenticatorType {
  if (attachment === "cross-platform") {
    return transports.includes("usb") || transports.includes("nfc") ? "security_key" : "cross-platform";
  }
  return "platform";
}

/** Sensible default label for a freshly enrolled passkey. */
export function defaultPasskeyLabel(platform: PasskeyPlatform): string {
  switch (platform) {
    case "windows_hello":     return "Windows Hello";
    case "touch_id":          return "Touch ID";
    case "face_id":           return "Face ID";
    case "android_biometric": return "Android Biometric";
    case "security_key":      return "Security Key";
    default:                  return "Passkey";
  }
}

// ─── Policy decisions ──────────────────────────────────────────────────

/** Only active (non-revoked) passkeys count towards policy. */
export function activePasskeys(rows: PasskeyRow[]): PasskeyRow[] {
  return rows.filter((r) => !r.revoked_at);
}

/** True when the account has at least one primary + one backup passkey. */
export function hasBackupPasskey(rows: PasskeyRow[]): boolean {
  const active = activePasskeys(rows);
  return active.some((r) => r.is_backup) && active.some((r) => !r.is_backup);
}

/** Founder security policy requires ≥ 2 active passkeys, incl. one backup. */
export function meetsFounderPasskeyPolicy(rows: PasskeyRow[]): boolean {
  const active = activePasskeys(rows);
  return active.length >= 2 && hasBackupPasskey(rows);
}

/** True if a caller is safe to remove the given passkey without lockout. */
export function canRemovePasskey(rows: PasskeyRow[], targetId: string): boolean {
  const active = activePasskeys(rows).filter((r) => r.id !== targetId);
  // Removing must leave at least one active passkey OR another MFA factor
  // (that second check is enforced server-side via securityScore).
  return active.length >= 1;
}

/** Recommended next step in enrollment. */
export type PasskeyEnrollStep =
  | "check_support"
  | "register_primary"
  | "register_backup"
  | "complete";

export function nextPasskeyStep(rows: PasskeyRow[], supported: boolean): PasskeyEnrollStep {
  if (!supported) return "check_support";
  const active = activePasskeys(rows);
  if (active.length === 0) return "register_primary";
  if (!hasBackupPasskey(rows)) return "register_backup";
  return "complete";
}

/** Human-readable status for the Security Center panel. */
export function passkeyStatus(rows: PasskeyRow[]): {
  count: number;
  backup: boolean;
  meetsFounderPolicy: boolean;
  platforms: PasskeyAuthenticatorType[];
} {
  const active = activePasskeys(rows);
  return {
    count: active.length,
    backup: hasBackupPasskey(rows),
    meetsFounderPolicy: meetsFounderPasskeyPolicy(rows),
    platforms: Array.from(new Set(active.map((r) => r.authenticator_type))),
  };
}
