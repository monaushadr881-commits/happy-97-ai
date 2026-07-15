import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://happy-x-nexus.lovable.app";

// Only public, indexable routes. Authenticated routes never appear here.
const PUBLIC_PATHS = ["/", "/design", "/trust", "/status", "/login", "/register"];

export const Route = createFileRoute("/api/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString().slice(0, 10);
        const urls = PUBLIC_PATHS.map(
          (path) =>
            `  <url><loc>${BASE_URL}${path}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>${path === "/" ? "1.0" : "0.7"}</priority></url>`,
        ).join("\n");
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
