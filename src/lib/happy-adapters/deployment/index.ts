/** Deployment target adapters — readiness + interfaces only. */
import { AdapterStatus, checkEnv, AdapterNotConfiguredError } from "../types";

export interface DeployRequest { artifactPath: string; channel?: string; }
export interface DeployAdapter { id: string; isConfigured(): boolean; deploy(req: DeployRequest): Promise<{ url?: string; releaseId: string }>; }

function make(id: string, envs: string[]): DeployAdapter {
  return {
    id,
    isConfigured: () => checkEnv(envs).configured,
    async deploy() {
      const c = checkEnv(envs); if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing);
      throw new Error(`${id}: deployment pipeline requires target CLI/API`);
    },
  };
}

export const googlePlay = make("deploy.google_play", ["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "ANDROID_PACKAGE_NAME"]);
export const appStore = make("deploy.app_store", ["APPSTORE_CONNECT_KEY_ID", "APPSTORE_CONNECT_ISSUER_ID", "APPSTORE_CONNECT_PRIVATE_KEY"]);
export const microsoftStore = make("deploy.microsoft_store", ["MICROSOFT_STORE_TENANT_ID", "MICROSOFT_STORE_CLIENT_ID", "MICROSOFT_STORE_CLIENT_SECRET"]);
export const netlify = make("deploy.netlify", ["NETLIFY_AUTH_TOKEN", "NETLIFY_SITE_ID"]);
export const vercel = make("deploy.vercel", ["VERCEL_TOKEN", "VERCEL_PROJECT_ID"]);
export const cloudflare = make("deploy.cloudflare", ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]);
export const docker = make("deploy.docker", ["DOCKER_REGISTRY", "DOCKER_USERNAME", "DOCKER_PASSWORD"]);

export const registry: Record<string, DeployAdapter> = { googlePlay, appStore, microsoftStore, netlify, vercel, cloudflare, docker };

export function readiness(): AdapterStatus[] {
  const envsFor: Record<string, string[]> = {
    "deploy.google_play": ["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "ANDROID_PACKAGE_NAME"],
    "deploy.app_store": ["APPSTORE_CONNECT_KEY_ID", "APPSTORE_CONNECT_ISSUER_ID", "APPSTORE_CONNECT_PRIVATE_KEY"],
    "deploy.microsoft_store": ["MICROSOFT_STORE_TENANT_ID", "MICROSOFT_STORE_CLIENT_ID", "MICROSOFT_STORE_CLIENT_SECRET"],
    "deploy.netlify": ["NETLIFY_AUTH_TOKEN", "NETLIFY_SITE_ID"],
    "deploy.vercel": ["VERCEL_TOKEN", "VERCEL_PROJECT_ID"],
    "deploy.cloudflare": ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
    "deploy.docker": ["DOCKER_REGISTRY", "DOCKER_USERNAME", "DOCKER_PASSWORD"],
  };
  return Object.values(registry).map((a) => ({ id: a.id, ...checkEnv(envsFor[a.id] ?? []) }));
}
