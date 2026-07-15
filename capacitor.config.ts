/**
 * R61 — Capacitor config for Android + iOS.
 * NOTE: This file registers the app's identity for future native builds.
 * Actual `npx cap add android` / `npx cap add ios` requires Android Studio
 * or Xcode locally and is NOT performed by the Lovable sandbox.
 * The Universal Deployment Runtime records these as BLOCKED with the exact
 * missing dependency, not as fabricated builds.
 */
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.happy.enterprise",
  appName: "HAPPY X",
  webDir: "dist",
  bundledWebRuntime: false,
  backgroundColor: "#0B0B0D",
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0B0B0D",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: { style: "DARK", backgroundColor: "#0B0B0D" },
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
  },
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
};

export default config;
