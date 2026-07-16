/**
 * R75 — Visual understanding.
 * Derives a short contextual hint from the workspace-context snapshot.
 * Pure function; consumes R73 workspace-context output.
 */
export type VisualContext = {
  route?: string;
  section?: string;
  component?: string;
};

export function describeContext(ctx: VisualContext): string | null {
  if (ctx.section) return `I noticed the ${ctx.section} section.`;
  if (ctx.component) return `Looking at the ${ctx.component} component.`;
  if (ctx.route) return `We're on ${ctx.route}.`;
  return null;
}
