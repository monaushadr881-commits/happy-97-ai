/** R73 — workspace context aggregator. Pure. */
export interface WorkspaceSnapshot {
  route: string;
  section?: string;
  component?: string;
  form?: string;
  error?: string;
  notificationCount: number;
  builder?: string;
  dashboard?: string;
  report?: string;
  analytics?: string;
  selection?: string;
  cursor?: { x: number; y: number };
}

export function normalizeWorkspace(input: Partial<WorkspaceSnapshot> & { route: string }): WorkspaceSnapshot {
  return {
    route: input.route,
    section: input.section,
    component: input.component,
    form: input.form,
    error: input.error,
    notificationCount: input.notificationCount ?? 0,
    builder: input.builder,
    dashboard: input.dashboard,
    report: input.report,
    analytics: input.analytics,
    selection: input.selection,
    cursor: input.cursor,
  };
}
