/** R66 FAIOS — deterministic intent + plan generator.
 * Runs server-side. No external AI dependency. Produces safe, structured plans
 * that the Founder can preview and approve. Native-build & publish steps mark
 * themselves blocked with the exact missing dependency.
 */
import type { FaiosCategory, FaiosPlan, FaiosPlanStep, FaiosRisk } from "./contracts";

interface IntentMatch {
  category: FaiosCategory;
  intent: string;
  risk: FaiosRisk;
  requires_approval: boolean;
  autoModeAllowed: boolean;
  build: (raw: string) => FaiosPlan;
}

const NATIVE_BLOCK = {
  android: {
    reason: "Android native build toolchain not provisioned in the sandbox.",
    toolchain: ["Android SDK", "Gradle", "JDK 17", "keystore"],
    secrets: ["ANDROID_KEYSTORE_BASE64", "ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEY_ALIAS", "ANDROID_KEY_PASSWORD"],
    accounts: ["Google Play Console"],
  },
  ios: {
    reason: "iOS native build toolchain requires macOS + Xcode; unavailable here.",
    toolchain: ["Xcode", "macOS host", "CocoaPods", "fastlane"],
    secrets: ["APPLE_APP_SPECIFIC_PASSWORD", "APPSTORE_CONNECT_API_KEY"],
    accounts: ["Apple Developer Program"],
  },
  desktop: {
    reason: "Desktop packaging (msix/dmg/appimage) requires per-OS toolchains not present.",
    toolchain: ["electron-builder OR tauri", "Windows/macOS/Linux hosts for signing"],
    secrets: ["MSIX_SIGNING_CERT", "APPLE_DEVELOPER_ID_CERT"],
    accounts: ["Microsoft Partner Center (optional)", "Apple Developer (optional)"],
  },
};

function step(order: number, title: string, extra: Partial<FaiosPlanStep> = {}): FaiosPlanStep {
  return { order, title, risk: "low", ...extra };
}

const INTENTS: IntentMatch[] = [
  {
    category: "ui", intent: "redesign_homepage", risk: "medium", requires_approval: true, autoModeAllowed: false,
    build: (raw) => ({
      summary: "Redesign homepage — layout, hero, and section spacing.",
      category: "ui", risk: "medium", requires_approval: true,
      steps: [
        step(1, "Analyze current homepage route", { files: ["src/routes/index.tsx"] }),
        step(2, "Draft updated hero + primary sections"),
        step(3, "Apply design tokens, reuse primitives"),
        step(4, "Run typecheck + accessibility audit"),
      ],
      impact: { files_touched_estimate: 2, performance: "neutral", accessibility: "reviewed", rollback: "git revert of homepage route" },
      estimated_minutes: 8,
    }),
  },
  {
    category: "ui", intent: "improve_ui", risk: "low", requires_approval: false, autoModeAllowed: true,
    build: () => ({
      summary: "Polish UI — spacing, contrast, hover, focus rings.",
      category: "ui", risk: "low", requires_approval: false,
      steps: [
        step(1, "Scan components for spacing/contrast issues"),
        step(2, "Apply refinements using design-system primitives"),
        step(3, "Verify WCAG AA contrast"),
      ],
      impact: { files_touched_estimate: 6, accessibility: "improved", rollback: "revert affected components" },
      estimated_minutes: 6,
    }),
  },
  {
    category: "build", intent: "build_android_apk", risk: "high", requires_approval: true, autoModeAllowed: false,
    build: () => ({
      summary: "Build Android APK.", category: "build", risk: "high", requires_approval: true,
      steps: [
        step(1, "Generate Capacitor/Gradle project scaffold"),
        step(2, "Configure signing (keystore)", { blocked: true, blocked_reason: NATIVE_BLOCK.android.reason, requires_credentials: NATIVE_BLOCK.android.secrets }),
        step(3, "Run assembleRelease → APK", { blocked: true, blocked_reason: NATIVE_BLOCK.android.reason }),
      ],
      impact: { files_touched_estimate: 4, rollback: "delete generated android/ folder" },
      estimated_minutes: 12,
      external_dependencies: { secrets: NATIVE_BLOCK.android.secrets, accounts: NATIVE_BLOCK.android.accounts, toolchain: NATIVE_BLOCK.android.toolchain },
      blocked: true, blocked_reason: NATIVE_BLOCK.android.reason,
    }),
  },
  {
    category: "build", intent: "build_android_aab", risk: "high", requires_approval: true, autoModeAllowed: false,
    build: () => ({
      summary: "Build Android AAB (Play Store bundle).",
      category: "build", risk: "high", requires_approval: true,
      steps: [
        step(1, "Configure bundle release"),
        step(2, "Sign AAB", { blocked: true, blocked_reason: NATIVE_BLOCK.android.reason }),
      ],
      impact: { files_touched_estimate: 3, rollback: "n/a" }, estimated_minutes: 12,
      external_dependencies: { secrets: NATIVE_BLOCK.android.secrets, accounts: NATIVE_BLOCK.android.accounts, toolchain: NATIVE_BLOCK.android.toolchain },
      blocked: true, blocked_reason: NATIVE_BLOCK.android.reason,
    }),
  },
  {
    category: "build", intent: "build_ios_ipa", risk: "high", requires_approval: true, autoModeAllowed: false,
    build: () => ({
      summary: "Build iOS IPA.", category: "build", risk: "high", requires_approval: true,
      steps: [
        step(1, "Generate iOS project scaffold"),
        step(2, "Archive + export IPA", { blocked: true, blocked_reason: NATIVE_BLOCK.ios.reason }),
      ],
      impact: { files_touched_estimate: 3, rollback: "delete ios/ folder" }, estimated_minutes: 15,
      external_dependencies: { secrets: NATIVE_BLOCK.ios.secrets, accounts: NATIVE_BLOCK.ios.accounts, toolchain: NATIVE_BLOCK.ios.toolchain },
      blocked: true, blocked_reason: NATIVE_BLOCK.ios.reason,
    }),
  },
  {
    category: "build", intent: "build_desktop", risk: "high", requires_approval: true, autoModeAllowed: false,
    build: () => ({
      summary: "Build desktop app package.", category: "build", risk: "high", requires_approval: true,
      steps: [step(1, "Package via electron/tauri", { blocked: true, blocked_reason: NATIVE_BLOCK.desktop.reason })],
      impact: { files_touched_estimate: 2, rollback: "n/a" }, estimated_minutes: 10,
      external_dependencies: NATIVE_BLOCK.desktop as any,
      blocked: true, blocked_reason: NATIVE_BLOCK.desktop.reason,
    }),
  },
  {
    category: "seo", intent: "optimize_seo", risk: "low", requires_approval: false, autoModeAllowed: true,
    build: () => ({
      summary: "Optimize SEO — head metadata, semantic HTML, alt text.",
      category: "seo", risk: "low", requires_approval: false,
      steps: [
        step(1, "Audit head() metadata across routes"),
        step(2, "Add canonical + og:image where missing"),
        step(3, "Ensure single H1 + alt text"),
      ],
      impact: { files_touched_estimate: 10, rollback: "revert affected routes" }, estimated_minutes: 12,
    }),
  },
  {
    category: "performance", intent: "improve_speed", risk: "low", requires_approval: false, autoModeAllowed: true,
    build: () => ({
      summary: "Improve performance — code-split, lazy load, image sizes.",
      category: "performance", risk: "low", requires_approval: false,
      steps: [
        step(1, "Identify heavy routes"),
        step(2, "Introduce React.lazy where safe"),
        step(3, "Verify no regressions"),
      ],
      impact: { files_touched_estimate: 8, performance: "improved", rollback: "revert lazy wrappers" }, estimated_minutes: 15,
    }),
  },
  {
    category: "bugfix", intent: "fix_bugs", risk: "medium", requires_approval: true, autoModeAllowed: false,
    build: () => ({
      summary: "Investigate and fix reported bugs.", category: "bugfix", risk: "medium", requires_approval: true,
      steps: [
        step(1, "Reproduce"), step(2, "Isolate root cause"), step(3, "Patch + typecheck"),
      ],
      impact: { files_touched_estimate: 3, rollback: "git revert patch commit" }, estimated_minutes: 20,
    }),
  },
  {
    category: "ui", intent: "add_animations", risk: "low", requires_approval: false, autoModeAllowed: true,
    build: () => ({
      summary: "Add motion — subtle enter/exit and hover transitions.",
      category: "ui", risk: "low", requires_approval: false,
      steps: [step(1, "Add Framer/CSS transitions to key surfaces"), step(2, "Respect prefers-reduced-motion")],
      impact: { files_touched_estimate: 5, accessibility: "reduced-motion respected", rollback: "revert motion utilities" }, estimated_minutes: 6,
    }),
  },
  {
    category: "deployment", intent: "deploy", risk: "high", requires_approval: true, autoModeAllowed: false,
    build: () => ({
      summary: "Deploy current build to production.",
      category: "deployment", risk: "high", requires_approval: true,
      steps: [step(1, "Trigger publish", { blocked: true, blocked_reason: "Deploy triggers require Founder to publish via the Lovable Publish flow." })],
      impact: { files_touched_estimate: 0, rollback: "Use Rollback from Release Center" }, estimated_minutes: 3,
      blocked: true, blocked_reason: "Publishing runs from the Lovable Publish flow.",
    }),
  },
  {
    category: "deployment", intent: "rollback", risk: "high", requires_approval: true, autoModeAllowed: false,
    build: () => ({
      summary: "Roll back the last release.",
      category: "deployment", risk: "high", requires_approval: true,
      steps: [step(1, "Locate previous stable release"), step(2, "Trigger rollout rollback in Release Center")],
      impact: { files_touched_estimate: 0, rollback: "n/a" }, estimated_minutes: 5,
    }),
  },
  {
    category: "feature", intent: "create_website", risk: "medium", requires_approval: true, autoModeAllowed: false,
    build: (raw) => ({
      summary: `Scaffold new website: ${raw}`,
      category: "feature", risk: "medium", requires_approval: true,
      steps: [
        step(1, "Design routes + head metadata"),
        step(2, "Generate pages with design-system primitives"),
        step(3, "Wire nav + SEO"),
      ],
      impact: { files_touched_estimate: 10, rollback: "revert new route files" }, estimated_minutes: 25,
    }),
  },
  {
    category: "database", intent: "optimize_database", risk: "high", requires_approval: true, autoModeAllowed: false,
    build: () => ({
      summary: "Optimize database — indexes, slow queries, RLS review.",
      category: "database", risk: "high", requires_approval: true,
      steps: [
        step(1, "Run slow-query analysis"),
        step(2, "Propose migration with indexes + explain plans"),
        step(3, "Founder approves migration"),
      ],
      impact: { files_touched_estimate: 1, security: "RLS preserved", rollback: "reverse migration" }, estimated_minutes: 30,
    }),
  },
];

const KEYWORDS: Array<[RegExp, string]> = [
  [/redesign\s+home/i, "redesign_homepage"],
  [/improve\s+ui|polish\s+ui|clean\s+up\s+ui/i, "improve_ui"],
  [/(build|create).*android.*apk|apk/i, "build_android_apk"],
  [/(build|create).*android.*aab|aab/i, "build_android_aab"],
  [/(build|create).*(iphone|ios).*ipa|\bipa\b/i, "build_ios_ipa"],
  [/(build|create).*desktop/i, "build_desktop"],
  [/optimi[sz]e\s+seo|improve\s+seo/i, "optimize_seo"],
  [/improve\s+speed|optimi[sz]e\s+performance|faster/i, "improve_speed"],
  [/fix\s+bugs?/i, "fix_bugs"],
  [/add\s+animations?/i, "add_animations"],
  [/^\s*(happy\s+)?deploy\b/i, "deploy"],
  [/roll ?back/i, "rollback"],
  [/create\s+(website|restaurant|hospital|crm|erp|admin|api|backend)/i, "create_website"],
  [/optimi[sz]e\s+database/i, "optimize_database"],
];

export interface DetectionResult {
  intent: string;
  category: FaiosCategory;
  plan: FaiosPlan;
  autoModeAllowed: boolean;
}

export function detectIntent(raw: string): DetectionResult {
  const text = raw.trim();
  for (const [re, key] of KEYWORDS) {
    if (re.test(text)) {
      const match = INTENTS.find((i) => i.intent === key);
      if (match) return { intent: key, category: match.category, plan: match.build(text), autoModeAllowed: match.autoModeAllowed };
    }
  }
  // Fallback: read-only explain
  return {
    intent: "explain",
    category: "unknown",
    autoModeAllowed: true,
    plan: {
      summary: `Explain / analyze request: "${text.slice(0, 200)}"`,
      category: "unknown", risk: "low", requires_approval: false,
      steps: [step(1, "Parse request"), step(2, "Locate relevant modules"), step(3, "Return explanation")],
      impact: { files_touched_estimate: 0, rollback: "n/a" }, estimated_minutes: 2,
    },
  };
}
