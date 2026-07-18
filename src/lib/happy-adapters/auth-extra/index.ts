/**
 * Auth method readiness (Magic Link, Phone OTP, Passkeys/WebAuthn). These are
 * all served by the canonical Lovable Cloud auth runtime — this file only
 * reports whether the surface is available; it does NOT create a second auth
 * system. Magic Link and Phone OTP work out of the box on managed auth;
 * Passkeys require the `WEBAUTHN_RP_ID` domain binding.
 */
import { AdapterStatus, checkEnv } from "../types";

export function readiness(): AdapterStatus[] {
  return [
    { id: "auth.magic_link", configured: true, missing: [], managed: true } as any,
    { id: "auth.phone_otp", configured: true, missing: [], managed: true } as any,
    { id: "auth.passkeys", ...checkEnv(["WEBAUTHN_RP_ID"]) },
  ];
}
