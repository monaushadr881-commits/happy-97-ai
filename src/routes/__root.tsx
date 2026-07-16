import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { KernelProvider } from "../kernel";
import { HappyDesk } from "../components/happy-desk/HappyDesk";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-8 h-px w-16 bg-hairline-gold" />
        <p className="eyebrow mb-4">Error 404</p>
        <h1 className="text-6xl font-medium text-paper">Off the map</h1>
        <p className="mt-4 text-sm text-soft-gray">
          The page you're looking for isn't part of the platform yet.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-obsidian transition-transform hover:scale-[1.02]"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-4">System notice</p>
        <h1 className="text-3xl font-medium text-paper">
          This screen didn't load
        </h1>
        <p className="mt-3 text-sm text-soft-gray">
          Something interrupted the experience. Try again or return home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-obsidian transition-transform hover:scale-[1.02]"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-gold/30 px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-gold/10"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HAPPY X — Human-Centered AI Operating Platform" },
      {
        name: "description",
        content:
          "HAPPY X by HAPPY PERSON PRIVATE LIMITED. The Enterprise AI Partner — a Human-Centered AI Operating Platform that helps you learn, build and grow, powered by HAPPY, the single digital human.",
      },
      { name: "author", content: "HAPPY PERSON PRIVATE LIMITED" },
      { name: "theme-color", content: "#0B0B0D" },
      { property: "og:title", content: "HAPPY X — Human-Centered AI Operating Platform" },
      {
        property: "og:description",
        content:
          "The Enterprise AI Partner. HAPPY helps you learn, build and grow — from HAPPY PERSON PRIVATE LIMITED.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Manrope:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/__l5e/assets-v1/f97dc3a4-df45-4ab3-9243-dee2ce4cbc3d/happy-ai-logo.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/happy-portrait-v2.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "HAPPY PERSON PRIVATE LIMITED",
          url: "https://happy-x-nexus.lovable.app",
          logo: "https://happy-x-nexus.lovable.app/happy-portrait-v2.png",
          sameAs: [],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "HAPPY X",
          url: "https://happy-x-nexus.lovable.app",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <KernelProvider>
        <Outlet />
        <HappyDesk />
      </KernelProvider>
    </QueryClientProvider>
  );
}
