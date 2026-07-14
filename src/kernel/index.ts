/**
 * HAPPY X Kernel — public surface.
 *
 * Import from "@/kernel" everywhere; never reach into individual files unless
 * you are extending the kernel itself.
 */

export { config, type HappyXConfig } from "./config";
export { logger, createLogger, type Logger, type LogLevel } from "./logger";
export { eventBus, createEventBus, type EventBus, type KernelEventMap } from "./event-bus";
export {
  isEnabled,
  setFlag,
  allFlags,
  initFeatureFlags,
  type FeatureFlagKey,
} from "./feature-flags";
export {
  can,
  canAny,
  canAll,
  permissionsForRoles,
  type AppRole,
  type Permission,
} from "./permissions";
export {
  MODULES,
  getModule,
  modulesByGroup,
  type ModuleDefinition,
  type ModuleId,
} from "./module-registry";
export { KernelProvider } from "./app-state";
export { ThemeProvider, useTheme, type ThemeName } from "./theme";
export {
  NotificationProvider,
  useNotifications,
  notify,
  type Notification,
  type NotificationLevel,
} from "./notifications";
export { runChat, type AiChatRequest, type AiChatResponse } from "./ai-service";
