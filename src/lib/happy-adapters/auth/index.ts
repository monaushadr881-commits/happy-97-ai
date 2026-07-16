/**
 * OAuth provider adapters — DO NOT replace existing auth. Google + Apple already
 * flow through `lovable.auth.signInWithOAuth`. These adapters expose readiness
 * for the remaining providers so the UI can show "connect" affordances once the
 * OAuth client credentials are added at the workspace level.
 */
import { AdapterStatus, checkEnv } from "../types";

const ENV = {
  google: ["GOOGLE_OAUTH_CLIENT_ID"],           // managed by Lovable Cloud by default
  apple: ["APPLE_OAUTH_CLIENT_ID"],             // managed by Lovable Cloud by default
  microsoft: ["MICROSOFT_OAUTH_CLIENT_ID", "MICROSOFT_OAUTH_CLIENT_SECRET"],
  github: ["GITHUB_OAUTH_CLIENT_ID", "GITHUB_OAUTH_CLIENT_SECRET"],
  linkedin: ["LINKEDIN_OAUTH_CLIENT_ID", "LINKEDIN_OAUTH_CLIENT_SECRET"],
  facebook: ["FACEBOOK_OAUTH_CLIENT_ID", "FACEBOOK_OAUTH_CLIENT_SECRET"],
};

export function readiness(): AdapterStatus[] {
  return [
    { id: "auth.google", ...checkEnv(ENV.google), managed: true } as any,
    { id: "auth.apple", ...checkEnv(ENV.apple), managed: true } as any,
    { id: "auth.microsoft", ...checkEnv(ENV.microsoft) },
    { id: "auth.github", ...checkEnv(ENV.github) },
    { id: "auth.linkedin", ...checkEnv(ENV.linkedin) },
    { id: "auth.facebook", ...checkEnv(ENV.facebook) },
  ];
}
