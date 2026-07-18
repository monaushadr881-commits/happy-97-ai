/**
 * Social publishing adapters — feed canonical Creator Studio publishing
 * pipeline (`creator-v1`). Every provider requires per-user OAuth via App
 * User Connectors; readiness reflects the workspace-level client only.
 */
import { AdapterStatus, checkEnv } from "../types";

const ENV = {
  instagram: ["INSTAGRAM_OAUTH_CLIENT_ID", "INSTAGRAM_OAUTH_CLIENT_SECRET"],
  facebook: ["FACEBOOK_OAUTH_CLIENT_ID", "FACEBOOK_OAUTH_CLIENT_SECRET"],
  youtube: ["YOUTUBE_OAUTH_CLIENT_ID", "YOUTUBE_OAUTH_CLIENT_SECRET"],
  linkedin: ["LINKEDIN_OAUTH_CLIENT_ID", "LINKEDIN_OAUTH_CLIENT_SECRET"],
  x: ["X_OAUTH_CLIENT_ID", "X_OAUTH_CLIENT_SECRET"],
  tiktok: ["TIKTOK_OAUTH_CLIENT_ID", "TIKTOK_OAUTH_CLIENT_SECRET"],
};

export function readiness(): AdapterStatus[] {
  return [
    { id: "social.instagram", ...checkEnv(ENV.instagram) },
    { id: "social.facebook", ...checkEnv(ENV.facebook) },
    { id: "social.youtube", ...checkEnv(ENV.youtube) },
    { id: "social.linkedin", ...checkEnv(ENV.linkedin) },
    { id: "social.x", ...checkEnv(ENV.x) },
    { id: "social.tiktok", ...checkEnv(ENV.tiktok) },
  ];
}
