import { expect, test } from "bun:test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Opt-in hosted read checks. Never log session values or response rows.
// Financial mutation probes use EXPLAIN without ANALYZE and are explicitly
// skipped where hosted query planning is disabled, never counted as passing.
const enabled = process.env.HAPPY_HOSTED_SECURITY_TESTS === "1";
const hostedTest = enabled ? test : test.skip;
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function client(authenticated: boolean) {
  if (!url || !key) throw new Error("Hosted configuration is required");
  const headers: Record<string, string> = {};
  if (authenticated) {
    const file = process.env.HAPPY_SECURITY_SESSION_FILE;
    if (!file) throw new Error("Managed session file is required");
    const session = JSON.parse(readFileSync(file, "utf8"));
    const token = session.session?.access_token;
    if (typeof token !== "string") throw new Error("Managed session unavailable");
    headers.Authorization = `Bearer ${token}`;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers, fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
      return fetch(input, { ...init, headers: h });
    } },
  });
}

for (const authenticated of [false, true]) {
  for (const table of ["credit_ledger_entries", "listing_purchases", "job_queue"]) {
    (enabled && process.env.HAPPY_HOSTED_EXPLAIN_ENABLED === "1" ? test : test.skip)(`${authenticated ? "authenticated" : "anonymous"} cannot plan a forged insert into ${table}`, async () => {
      const sb = client(authenticated);
      const payload = table === "credit_ledger_entries"
        ? { owner_type: "user", owner_id: "11111111-1111-4111-8111-111111111111", direction: "credit", amount: 999999, entry_type: "purchase" }
        : table === "job_queue" ? { kind: "forged", company_id: null }
        : { listing_id: "11111111-1111-4111-8111-111111111111", buyer_id: "11111111-1111-4111-8111-111111111111", seller_id: "11111111-1111-4111-8111-111111111111", purchase_type: "free", version_at_purchase: 1, status: "active" };
      const { error } = await sb.from(table).insert(payload).explain({ analyze: false });
      expect(error?.code).toBe("42501");
    });
  }
}

hostedTest("anonymous cannot read the execution queue", async () => {
  const { error } = await client(false).from("job_queue").select("id").limit(1);
  expect(error?.code).toBe("42501");
});

hostedTest("non-Founder cannot read global execution jobs", async () => {
  const sb = client(true);
  const file = process.env.HAPPY_SECURITY_SESSION_FILE;
  if (!file) throw new Error("Managed session file is required");
  const session = JSON.parse(readFileSync(file, "utf8"));
  const uid = session.session?.user?.id;
  if (typeof uid !== "string") throw new Error("Managed identity unavailable");
  const role = await sb.rpc("is_platform_founder", { _user_id: uid });
  expect(role.error).toBeNull();
  expect(role.data).toBe(false);
  const { data, error } = await sb.from("job_queue").select("id").is("company_id", null);
  expect(error).toBeNull();
  expect(data).toEqual([]);
});