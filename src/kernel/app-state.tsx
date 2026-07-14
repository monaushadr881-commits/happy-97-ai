/**
 * HAPPY X Kernel — Global App State
 *
 * Single provider that composes every kernel subsystem so `<KernelProvider>`
 * is the only wire-up the app needs.
 */

import { useEffect, type ReactNode } from "react";
import { NotificationProvider } from "./notifications";
import { ThemeProvider } from "./theme";
import { initFeatureFlags } from "./feature-flags";
import { logger } from "./logger";
import { config } from "./config";

export function KernelProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initFeatureFlags();
    logger.info("HAPPY X kernel ready", {
      env: config.app.environment,
      version: config.app.version,
    });
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </ThemeProvider>
  );
}
