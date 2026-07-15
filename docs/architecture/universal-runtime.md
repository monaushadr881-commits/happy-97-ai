# HAPPY Universal Runtime

One codebase, one brain, one Digital Human — rendered across every surface.

## Targets
Android, iOS, Web, Windows, macOS, Linux, Tablet, PWA, Smart TV, Wearables.

## Shell strategy
- Web + PWA today via TanStack Start on Cloudflare Workers.
- Android / iOS via a Capacitor shell (separate track) wrapping the same
  web build; native features added via Capacitor plugins.
- Desktop via the same PWA install path; Tauri/Electron shell optional.

## Platform adaptation
- Android: native navigation, sheets, Material behavior, haptics, permissions.
- iOS: Apple sheets, native gestures, biometrics, haptics.
- Desktop: keyboard shortcuts, multi-window, resizable panels, drag/drop.
- Web: responsive, SEO, keyboard, mouse.
- PWA: offline, install prompt, push, background sync.

## Universal features
Digital Human, AI Chat, Voice, Presentation, Whiteboard, Builder,
Marketplace, Credits, Wallet, Notifications, Founder Dashboard, Analytics,
Settings — same components, adapted per surface.

## Performance / a11y baseline
Streaming, lazy loading, GPU rendering, CSS variables, memoization,
caching, React Query, virtualization, code splitting, 60 FPS, zero CLS,
WCAG AAA, keyboard, ARIA, reduced motion, high contrast, voice nav,
screen readers.

Architecture, DB, APIs, RBAC, security, credits, wallet, revenue,
marketplace, notifications, builder, hosting, domains, theme engine,
wallpaper engine, and design system are frozen. This runtime is additive.
