/**
 * Push notification adapters. Feed the existing HAPPY notification runtime;
 * do not create a second delivery/notification system.
 */
import { AdapterStatus, checkEnv, AdapterNotConfiguredError } from "../types";

export interface PushMessage { to: string; title: string; body: string; data?: Record<string, string>; }
export interface PushAdapter { id: string; isConfigured(): boolean; send(msg: PushMessage): Promise<{ providerRef: string }>; }

function make(id: string, envs: string[]): PushAdapter {
  return {
    id,
    isConfigured: () => checkEnv(envs).configured,
    async send() {
      const c = checkEnv(envs); if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing);
      throw new Error(`${id}: provider SDK/API call not wired`);
    },
  };
}

export const fcm = make("push.fcm", ["FCM_SERVER_KEY", "FCM_PROJECT_ID"]);
export const apns = make("push.apns", ["APNS_KEY_ID", "APNS_TEAM_ID", "APNS_PRIVATE_KEY", "APNS_BUNDLE_ID"]);
export const webpush = make("push.web", ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"]);
export const onesignal = make("push.onesignal", ["ONESIGNAL_APP_ID", "ONESIGNAL_REST_API_KEY"]);

export const registry: Record<string, PushAdapter> = { fcm, apns, webpush, onesignal };

export function readiness(): AdapterStatus[] {
  const envsFor: Record<string, string[]> = {
    "push.fcm": ["FCM_SERVER_KEY", "FCM_PROJECT_ID"],
    "push.apns": ["APNS_KEY_ID", "APNS_TEAM_ID", "APNS_PRIVATE_KEY", "APNS_BUNDLE_ID"],
    "push.web": ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"],
    "push.onesignal": ["ONESIGNAL_APP_ID", "ONESIGNAL_REST_API_KEY"],
  };
  return Object.values(registry).map((a) => ({ id: a.id, ...checkEnv(envsFor[a.id] ?? []) }));
}
