/**
 * R106 — Production Security Hardening tests.
 *
 * Guards against regressions of the fixes shipped in this pass:
 *   1. AppError.toJSON must NOT leak developerMessage / cause.
 *   2. sanitizePgRestLike strips SQL LIKE + PostgREST-reserved characters.
 *   3. assertCronAuth requires the CRON_SHARED_SECRET header.
 *   4. Cron route handlers reject requests without the shared secret.
 *   5. /api/dh/tts requires a Supabase bearer token.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { AppError, dbError } from "@/services/core/errors";
import { sanitizePgRestLike } from "@/lib/security/pgrest-sanitize";
import { assertCronAuth } from "@/lib/security/cron-auth";

describe("R106 — AppError does not leak internals to clients", () => {
  it("toJSON omits developerMessage and cause", () => {
    const e = dbError(new Error("PG: relation \"secret_table\" does not exist"));
    const json = e.toJSON() as Record<string, unknown>;
    expect(json.code).toBe("INFRA.DB_ERROR");
    expect(json.message).toBeTruthy();
    expect(json).not.toHaveProperty("developerMessage");
    expect(json).not.toHaveProperty("cause");
    // Regression: raw driver text must not appear in serialized error.
    expect(JSON.stringify(json)).not.toContain("secret_table");
  });

  it("developerMessage is retained on the instance for server-side logging", () => {
    const e = new AppError("INFRA.UPSTREAM_ERROR", { developerMessage: "upstream 500: gateway_x" });
    // Still available to server-side loggers via instance property...
    expect(e.developerMessage).toBe("upstream 500: gateway_x");
    // ...but never in the wire payload.
    expect(JSON.stringify(e.toJSON())).not.toContain("gateway_x");
  });
});

describe("R106 — PostgREST filter sanitizer", () => {
  it("strips comma, dot, parens, colon, star, quote, backslash", () => {
    const out = sanitizePgRestLike("a,b.c(d)e:f*g\"h\\i");
    expect(out).not.toMatch(/[,.():*"\\]/);
  });
  it("strips SQL LIKE wildcards", () => {
    expect(sanitizePgRestLike("100%_off")).not.toMatch(/[%_]/);
  });
  it("cannot inject an extra .or() clause", () => {
    // Attempt: name.ilike.%foo%,is_admin.eq.true
    const evil = "foo%,is_admin.eq.true";
    const safe = sanitizePgRestLike(evil);
    expect(safe).not.toContain(",");
    expect(safe).not.toContain(".");
  });
  it("caps length", () => {
    expect(sanitizePgRestLike("a".repeat(500)).length).toBeLessThanOrEqual(120);
  });
  it("returns empty string on empty input", () => {
    expect(sanitizePgRestLike("")).toBe("");
    expect(sanitizePgRestLike(",,,...")).toBe("");
  });
});

describe("R106 — Cron shared-secret authenticator", () => {
  const OLD = process.env.CRON_SHARED_SECRET;
  const SECRET = "test-cron-secret-value-1234567890";
  beforeAll(() => { process.env.CRON_SHARED_SECRET = SECRET; });
  afterAll(() => { process.env.CRON_SHARED_SECRET = OLD; });

  it("rejects requests with no secret", async () => {
    const res = assertCronAuth(new Request("http://x/cron", { method: "POST" }));
    expect(res?.status).toBe(401);
  });
  it("rejects requests with wrong secret", async () => {
    const res = assertCronAuth(new Request("http://x/cron", {
      method: "POST", headers: { "x-cron-secret": "nope" },
    }));
    expect(res?.status).toBe(401);
  });
  it("accepts the correct secret via x-cron-secret header", async () => {
    const res = assertCronAuth(new Request("http://x/cron", {
      method: "POST", headers: { "x-cron-secret": SECRET },
    }));
    expect(res).toBeNull();
  });
  it("accepts the correct secret via Authorization: Bearer", async () => {
    const res = assertCronAuth(new Request("http://x/cron", {
      method: "POST", headers: { authorization: `Bearer ${SECRET}` },
    }));
    expect(res).toBeNull();
  });
  it("fails closed when the secret env var is missing", async () => {
    delete process.env.CRON_SHARED_SECRET;
    const res = assertCronAuth(new Request("http://x/cron", {
      method: "POST", headers: { "x-cron-secret": SECRET },
    }));
    expect(res?.status).toBe(500);
    process.env.CRON_SHARED_SECRET = SECRET;
  });
});

describe("R106 — every cron route uses assertCronAuth", () => {
  it("no cron route relies on SUPABASE_PUBLISHABLE_KEY for auth", () => {
    const dir = "src/routes/api/public/cron";
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".ts")) continue;
      const body = readFileSync(`${dir}/${f}`, "utf8");
      expect(body, `${f} must import assertCronAuth`).toContain("assertCronAuth");
      expect(body, `${f} must NOT gate on SUPABASE_PUBLISHABLE_KEY`).not.toContain("SUPABASE_PUBLISHABLE_KEY");
    }
  });
});

describe("R106 — dh.tts route requires authentication and rate-limits", () => {
  it("source references bearer token and rate limiter", () => {
    const body = readFileSync("src/routes/api/dh.tts.ts", "utf8");
    expect(body).toContain("authorization");
    expect(body).toMatch(/Bearer/);
    expect(body).toContain("checkRateLimit");
    // No unauthenticated fallthrough to LOVABLE_API_KEY.
    const authIdx = body.indexOf("authenticate(request)");
    const keyIdx = body.indexOf("LOVABLE_API_KEY");
    expect(authIdx).toBeGreaterThan(-1);
    expect(keyIdx).toBeGreaterThan(authIdx);
  });
});

describe("R106 — search functions sanitize PostgREST input", () => {
  it.each([
    "src/lib/business-v1.functions.ts",
    "src/lib/education-v1.functions.ts",
    "src/lib/hyperlocal-v1.functions.ts",
    "src/lib/knowledge-v1.functions.ts",
  ])("%s imports sanitizePgRestLike and no longer uses raw data.q in .or()", (path) => {
    const body = readFileSync(path, "utf8");
    expect(body).toContain("sanitizePgRestLike");
    // Regression: no raw `${data.q}` inside a `.or(...)` template.
    const orCalls = body.match(/\.or\(`[^`]+`\)/g) ?? [];
    for (const call of orCalls) {
      expect(call, `raw data.q interpolation in ${path}`).not.toMatch(/\$\{data\.q[^}]*\}/);
      expect(call, `raw data.question interpolation in ${path}`).not.toMatch(/\$\{data\.question[^}]*\}/);
    }
  });
});
