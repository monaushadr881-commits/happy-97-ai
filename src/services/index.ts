/**
 * HAPPY X — Service Registry
 *
 * Central export surface. UI code MUST NOT import repositories or
 * Supabase clients directly — always go through server functions that
 * delegate to these services.
 */

export * as core from "./core";
export * from "./middleware";

// Domain services
export { platformService } from "./domain/platform.service";
export { authzService } from "./domain/authz.service";
export { companyService } from "./domain/company.service";
export { brandService } from "./domain/brand.service";
export { workspaceService } from "./domain/workspace.service";
export { userService } from "./domain/user.service";
export { settingsService } from "./domain/settings.service";
export { notificationService } from "./domain/notification.service";
export { auditService } from "./domain/audit.service";
export { aiService } from "./domain/ai.service";
export { conversationService } from "./domain/conversation.service";
export { searchService } from "./domain/search.service";
export { analyticsService } from "./domain/analytics.service";
export { featureFlagService } from "./domain/feature-flag.service";
export { localizationService } from "./domain/localization.service";
export { integrationService } from "./domain/integration.service";
export { jobsService } from "./domain/jobs.service";

// Roadmap (v2.0 – v6.0) — reserved service interfaces
export {
  agentOsService,
  intelligenceService,
  globalService,
  enterpriseCloudService,
  autonomousService,
  type RoadmapNotImplemented,
} from "./domain/roadmap.service";
