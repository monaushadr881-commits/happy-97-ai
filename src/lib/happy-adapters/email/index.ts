/**
 * Email provider adapters. These sit behind the existing HAPPY email pipeline
 * (`@lovable.dev/email-js` scaffolds + notifications runtime). The default
 * platform sender remains Lovable Emails; these are opt-in overrides.
 */
import { AdapterStatus, checkEnv, AdapterNotConfiguredError, env } from "../types";

export interface EmailMessage { to: string | string[]; from: string; subject: string; html?: string; text?: string; replyTo?: string; }
export interface EmailAdapter { id: string; isConfigured(): boolean; send(msg: EmailMessage): Promise<{ providerRef: string }>; }

function guard(id: string, envs: string[]) { const c = checkEnv(envs); if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing); }

export const smtp: EmailAdapter = {
  id: "email.smtp",
  isConfigured: () => checkEnv(["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"]).configured,
  async send() { guard(this.id, ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"]); throw new Error("SMTP client not bundled for edge runtime"); },
};

export const resend: EmailAdapter = {
  id: "email.resend",
  isConfigured: () => checkEnv(["RESEND_API_KEY"]).configured,
  async send(msg) {
    guard(this.id, ["RESEND_API_KEY"]);
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "content-type": "application/json" },
      body: JSON.stringify(msg),
    });
    if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
    const j: any = await r.json();
    return { providerRef: j.id };
  },
};

export const sendgrid: EmailAdapter = {
  id: "email.sendgrid",
  isConfigured: () => checkEnv(["SENDGRID_API_KEY"]).configured,
  async send() { guard(this.id, ["SENDGRID_API_KEY"]); throw new Error("sendgrid payload builder not wired"); },
};

export const ses: EmailAdapter = {
  id: "email.ses",
  isConfigured: () => checkEnv(["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"]).configured,
  async send() { guard(this.id, ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"]); throw new Error("SES SigV4 signer not bundled"); },
};

export const mailgun: EmailAdapter = {
  id: "email.mailgun",
  isConfigured: () => checkEnv(["MAILGUN_API_KEY", "MAILGUN_DOMAIN"]).configured,
  async send() { guard(this.id, ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"]); throw new Error("mailgun form-encoded call not wired"); },
};

export const registry: Record<string, EmailAdapter> = { smtp, resend, sendgrid, ses, mailgun };

export function readiness(): AdapterStatus[] {
  const envsFor: Record<string, string[]> = {
    "email.smtp": ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"],
    "email.resend": ["RESEND_API_KEY"],
    "email.sendgrid": ["SENDGRID_API_KEY"],
    "email.ses": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
    "email.mailgun": ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"],
  };
  return Object.values(registry).map((a) => ({ id: a.id, ...checkEnv(envsFor[a.id] ?? []) }));
}
