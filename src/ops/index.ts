/**
 * HAPPY X Ops — Public API surface.
 *
 * All operations code MUST be consumed via this registry. Founder
 * Dashboard (Phase 6) reads exclusively from these services.
 */
export { healthService, type HealthReport, type HealthStatus } from "./health.service";
export { metricsService } from "./metrics.service";
export { alertingService } from "./alerting.service";
export { incidentService } from "./incident.service";
export { deploymentService } from "./deployment.service";
export { queueOpsService } from "./queue-ops.service";
export { securityOpsService } from "./security-ops.service";
export { aiOpsService } from "./ai-ops.service";
export { dbOpsService } from "./db-ops.service";
