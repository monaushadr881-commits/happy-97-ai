/** WhatsApp adapters — plug into `communications-v16` broadcast/inbox. */
import { AdapterStatus, checkEnv, AdapterNotConfiguredError, env } from "../types";

export interface WaMessage { to: string; template?: string; text?: string; variables?: string[]; }
export interface WaAdapter { id: string; isConfigured(): boolean; send(m: WaMessage): Promise<{ providerRef: string }>; }

function guard(id: string, envs: string[]) { const c = checkEnv(envs); if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing); }

export const cloudApi: WaAdapter = {
  id: "whatsapp.cloud_api",
  isConfigured: () => checkEnv(["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"]).configured,
  async send(m) {
    guard(this.id, ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"]);
    const token = env("WHATSAPP_ACCESS_TOKEN")!;
    const phoneId = env("WHATSAPP_PHONE_NUMBER_ID")!;
    const body = m.template
      ? { messaging_product: "whatsapp", to: m.to, type: "template", template: { name: m.template, language: { code: "en_US" }, components: m.variables ? [{ type: "body", parameters: m.variables.map((v) => ({ type: "text", text: v })) }] : [] } }
      : { messaging_product: "whatsapp", to: m.to, type: "text", text: { body: m.text ?? "" } };
    const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`whatsapp ${r.status}: ${await r.text()}`);
    const j: any = await r.json();
    return { providerRef: j.messages?.[0]?.id ?? "" };
  },
};

export const twilioWa: WaAdapter = {
  id: "whatsapp.twilio",
  isConfigured: () => checkEnv(["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"]).configured,
  async send() { guard(this.id, ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"]); throw new Error("twilio whatsapp payload not wired"); },
};

export const registry: Record<string, WaAdapter> = { cloudApi, twilioWa };

export function readiness(): AdapterStatus[] {
  const envsFor: Record<string, string[]> = {
    "whatsapp.cloud_api": ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
    "whatsapp.twilio": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"],
  };
  return Object.values(registry).map((a) => ({ id: a.id, ...checkEnv(envsFor[a.id] ?? []) }));
}
