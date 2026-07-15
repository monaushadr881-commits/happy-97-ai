/** HAPPY OS — Workspace Runtime public surface (R21). */
export { WorkspaceProvider, useWorkspace } from "./context";
export { workspaceMemory } from "./memory";
export { WORKSPACES, BUSINESSES, getWorkspace, workspaceForRoute } from "./registry";
export type { WorkspaceDef, WorkspaceId, BusinessIdentity } from "./registry";
