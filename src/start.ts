import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Real security headers on every response.
 *
 *   Content-Security-Policy is Report-Only for this recovery batch to avoid
 *   breaking third-party scripts that already load (Google Fonts, Lovable
 *   preview harness). Flip to enforcing once every third-party origin is
 *   whitelisted in a follow-up batch.
 *
 *   The header list is verifiable via:  curl -I https://<domain>/
 */
const securityHeadersMiddleware = createMiddleware().server(async ({ next, request }) => {
  const result = await next();
  const response = result.response;
  if (!(response instanceof Response)) return result;

  // Never override an existing header — some routes (e.g. the html shell) may
  // have set their own CSP for embedded content.
  const set = (name: string, value: string) => {
    if (!response.headers.has(name)) response.headers.set(name, value);
  };

  set(
    "Content-Security-Policy-Report-Only",
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Vite dev + AI SDK need eval + inline; keep permissive for now, tighten later.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'self' https://*.lovable.dev https://*.lovableproject.com https://*.lovableproject-dev.com",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  set("X-Content-Type-Options", "nosniff");
  set("Referrer-Policy", "strict-origin-when-cross-origin");
  set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(), payment=(self), usb=()",
  );
  // We render inside Lovable's preview iframe, so we allow ancestors via CSP
  // (above) but keep X-Frame-Options for older browsers that fall back to it.
  const host = request.headers.get("host") ?? "";
  if (!host.includes("lovable")) set("X-Frame-Options", "DENY");
  set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  return result;
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, securityHeadersMiddleware],
}));
