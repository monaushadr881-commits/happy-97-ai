/**
 * Route smoke tests via HTTP fetch — runs under vitest without a browser.
 * Requires the dev server (localhost:8080) to be running.
 */
import { describe, it, expect } from "vitest";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8080";
const routes = ["/", "/auth", "/login", "/register", "/status", "/trust", "/design"];

async function reachable() {
  try {
    const r = await fetch(BASE, { method: "GET" });
    return r.status < 500;
  } catch {
    return false;
  }
}

describe("public route smoke (HTTP)", async () => {
  const live = await reachable();
  const maybe = live ? it : it.skip;
  for (const path of routes) {
    maybe(`GET ${path} responds < 400 with HTML`, async () => {
      const res = await fetch(`${BASE}${path}`);
      expect(res.status, `HTTP for ${path}`).toBeLessThan(400);
      const body = await res.text();
      expect(body.length).toBeGreaterThan(100);
      expect(body.toLowerCase()).toContain("<html");
    });
  }
});
