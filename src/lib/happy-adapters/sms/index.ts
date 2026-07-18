/**
 * SMS adapters — feed the canonical communication runtime
 * (`communications-v16`). Providers are opt-in overrides; the default carrier
 * remains the Lovable Cloud auth SMS path for Phone OTP.
 */
import { AdapterStatus, checkEnv, AdapterNotConfiguredError, env } from "../types";

export interface SmsMessage { to: string; from?: string; body: string; }
export interface SmsAdapter { id: string; isConfigured(): boolean; send(m: SmsMessage): Promise<{ providerRef: string }>; }

function guard(id: string, envs: string[]) { const c = checkEnv(envs); if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing); }

export const twilio: SmsAdapter = {
  id: "sms.twilio",
  isConfigured: () => checkEnv(["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"]).configured,
  async send(m) {
    guard(this.id, ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"]);
    const sid = env("TWILIO_ACCOUNT_SID")!;
    const auth = env("TWILIO_AUTH_TOKEN")!;
    const from = m.from ?? env("TWILIO_FROM_NUMBER")!;
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${auth}`)}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: m.to, From: from, Body: m.body }).toString(),
    });
    if (!r.ok) throw new Error(`twilio ${r.status}: ${await r.text()}`);
    const j: any = await r.json();
    return { providerRef: j.sid };
  },
};

export const messagebird: SmsAdapter = {
  id: "sms.messagebird",
  isConfigured: () => checkEnv(["MESSAGEBIRD_API_KEY"]).configured,
  async send() { guard(this.id, ["MESSAGEBIRD_API_KEY"]); throw new Error("messagebird payload builder not wired"); },
};

export const awsSns: SmsAdapter = {
  id: "sms.aws_sns",
  isConfigured: () => checkEnv(["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"]).configured,
  async send() { guard(this.id, ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"]); throw new Error("SNS SigV4 signer not bundled"); },
};

export const registry: Record<string, SmsAdapter> = { twilio, messagebird, awsSns };

export function readiness(): AdapterStatus[] {
  const envsFor: Record<string, string[]> = {
    "sms.twilio": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"],
    "sms.messagebird": ["MESSAGEBIRD_API_KEY"],
    "sms.aws_sns": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
  };
  return Object.values(registry).map((a) => ({ id: a.id, ...checkEnv(envsFor[a.id] ?? []) }));
}
