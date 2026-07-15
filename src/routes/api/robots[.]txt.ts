import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://happy-x-nexus.lovable.app";

export const Route = createFileRoute("/api/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /_authenticated/",
          "Disallow: /api/",
          "",
          `Sitemap: ${BASE_URL}/sitemap.xml`,
          "",
        ].join("\n");
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
