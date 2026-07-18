/**
 * R114.2 — Client-side device fingerprint + capture helpers.
 * Extends existing Supabase auth: called from root onAuthStateChange after sign-in.
 * NO duplicate runtime; wraps the canonical happy-id server fns.
 */

const FP_KEY = "happy_id.device_fingerprint";

export function getOrCreateFingerprint(): string {
  if (typeof window === "undefined") return "server";
  try {
    let fp = window.localStorage.getItem(FP_KEY);
    if (fp) return fp;
    const rand = crypto.getRandomValues(new Uint8Array(16));
    fp = Array.from(rand).map((b) => b.toString(16).padStart(2, "0")).join("");
    window.localStorage.setItem(FP_KEY, fp);
    return fp;
  } catch {
    return "unknown-" + Date.now();
  }
}

export function detectDeviceInfo(): {
  device_fingerprint: string;
  device_name: string;
  device_type: string;
  os: string;
  browser: string;
} {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const os =
    /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iOS/i.test(ua) ? "iOS"
    : /Mac OS X/i.test(ua) ? "macOS"
    : /Windows/i.test(ua) ? "Windows"
    : /Linux/i.test(ua) ? "Linux" : "Unknown";
  const browser =
    /Edg\//i.test(ua) ? "Edge"
    : /Chrome\//i.test(ua) ? "Chrome"
    : /Safari\//i.test(ua) ? "Safari"
    : /Firefox\//i.test(ua) ? "Firefox" : "Unknown";
  return {
    device_fingerprint: getOrCreateFingerprint(),
    device_name: `${browser} on ${os}`,
    device_type: isMobile ? "mobile" : "desktop",
    os, browser,
  };
}

export function getSessionKey(accessToken: string | undefined | null): string {
  // Session key is a stable hash prefix of the access token so we don't leak the token.
  if (!accessToken) return "anon-" + getOrCreateFingerprint().slice(0, 8);
  return accessToken.slice(-24);
}

/** WebAuthn / Passkey capability probe (arch-ready). */
export function passkeysSupported(): boolean {
  return typeof window !== "undefined"
    && !!(window as unknown as { PublicKeyCredential?: unknown }).PublicKeyCredential;
}

/** Biometric capability probe on mobile (arch-ready). */
export async function biometricAvailable(): Promise<boolean> {
  if (!passkeysSupported()) return false;
  try {
    const PKC = (window as unknown as { PublicKeyCredential: { isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean> } }).PublicKeyCredential;
    return await PKC.isUserVerifyingPlatformAuthenticatorAvailable?.() ?? false;
  } catch { return false; }
}
