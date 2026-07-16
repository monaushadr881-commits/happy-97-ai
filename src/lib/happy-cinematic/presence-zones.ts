/** R71.2 — presence zone geometry per route. */

export interface ZoneGeometry {
  entry: [number, number];    // normalized 0..1 viewport coords
  stop: [number, number];
  greetingDistance: number;   // px from user focus
  facing: "left" | "right" | "center";
}

const ZONES: Record<string, ZoneGeometry> = {
  "/":                { entry: [0.9, 0.9], stop: [0.75, 0.65], greetingDistance: 220, facing: "left" },
  "/pricing":         { entry: [0.9, 0.85], stop: [0.7, 0.6], greetingDistance: 200, facing: "left" },
  "/builder":         { entry: [0.05, 0.9], stop: [0.2, 0.65], greetingDistance: 240, facing: "right" },
  "/uabr":            { entry: [0.05, 0.9], stop: [0.2, 0.65], greetingDistance: 240, facing: "right" },
  "/founder":         { entry: [0.9, 0.85], stop: [0.72, 0.55], greetingDistance: 210, facing: "left" },
  "/founder-ai":      { entry: [0.9, 0.85], stop: [0.72, 0.55], greetingDistance: 210, facing: "left" },
  "/crm":             { entry: [0.9, 0.9], stop: [0.78, 0.7], greetingDistance: 200, facing: "left" },
  "/erp":             { entry: [0.9, 0.9], stop: [0.78, 0.7], greetingDistance: 200, facing: "left" },
  "/hrms":            { entry: [0.9, 0.9], stop: [0.78, 0.7], greetingDistance: 200, facing: "left" },
  "/marketplace":     { entry: [0.5, 0.95], stop: [0.5, 0.7], greetingDistance: 220, facing: "center" },
  "/learning":        { entry: [0.5, 0.95], stop: [0.5, 0.7], greetingDistance: 220, facing: "center" },
  "/analytics":       { entry: [0.9, 0.9], stop: [0.75, 0.65], greetingDistance: 200, facing: "left" },
  "/support":         { entry: [0.05, 0.9], stop: [0.22, 0.7], greetingDistance: 200, facing: "right" },
  "/live":            { entry: [0.9, 0.9], stop: [0.75, 0.65], greetingDistance: 220, facing: "left" },
  "/happy":           { entry: [0.5, 0.95], stop: [0.5, 0.7], greetingDistance: 240, facing: "center" },
};

export function resolveZone(route: string): ZoneGeometry {
  for (const key of Object.keys(ZONES).sort((a, b) => b.length - a.length)) {
    if (route === key || route.startsWith(key + "/")) return ZONES[key];
  }
  return ZONES["/"];
}
