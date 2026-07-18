/**
 * Storage adapters. Canonical owner is Lovable Cloud storage (managed).
 * Additional providers are readiness stubs that plug into the existing file
 * intelligence (`src/lib/happy-r119/file-intelligence.ts`) — they never
 * replace the canonical bucket layer.
 */
import { AdapterStatus, checkEnv } from "../types";

const ENV = {
  supabase: ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"],
  s3: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "AWS_S3_BUCKET"],
  r2: ["CLOUDFLARE_R2_ACCOUNT_ID", "CLOUDFLARE_R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_SECRET_ACCESS_KEY", "CLOUDFLARE_R2_BUCKET"],
  gcs: ["GCS_PROJECT_ID", "GCS_BUCKET", "GCS_SERVICE_ACCOUNT_JSON"],
  gdrive: ["GDRIVE_OAUTH_CLIENT_ID", "GDRIVE_OAUTH_CLIENT_SECRET"],
};

export function readiness(): AdapterStatus[] {
  return [
    { id: "storage.supabase", ...checkEnv(ENV.supabase), managed: true } as any,
    { id: "storage.s3", ...checkEnv(ENV.s3) },
    { id: "storage.r2", ...checkEnv(ENV.r2) },
    { id: "storage.gcs", ...checkEnv(ENV.gcs) },
    { id: "storage.gdrive", ...checkEnv(ENV.gdrive) },
  ];
}
