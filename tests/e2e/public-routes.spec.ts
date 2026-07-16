import { test, expect } from "@playwright/test";

const routes = ["/", "/auth", "/login", "/register", "/status", "/trust", "/design"];

for (const path of routes) {
  test(`public route ${path} renders without page errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    const resp = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(resp?.status(), `HTTP for ${path}`).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
    expect(errors, `page errors on ${path}`).toEqual([]);
  });
}

test("authenticated route redirects to /auth", async ({ page }) => {
  const resp = await page.goto("/founder", { waitUntil: "domcontentloaded" });
  expect(resp?.status()).toBeLessThan(500);
  await page.waitForURL(/\/auth/, { timeout: 10_000 });
});
