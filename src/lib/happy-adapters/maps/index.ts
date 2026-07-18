/** Maps & location adapters — readiness only; consumers use provider SDKs directly. */
import { AdapterStatus, checkEnv } from "../types";

const ENV = {
  googleMaps: ["GOOGLE_MAPS_API_KEY"],
  mapbox: ["MAPBOX_ACCESS_TOKEN"],
  here: ["HERE_MAPS_API_KEY"],
};

export function readiness(): AdapterStatus[] {
  return [
    { id: "maps.google", ...checkEnv(ENV.googleMaps) },
    { id: "maps.mapbox", ...checkEnv(ENV.mapbox) },
    { id: "maps.here", ...checkEnv(ENV.here) },
    // Browser Geolocation API — no credentials required; runtime-only.
    { id: "maps.geolocation_browser", configured: true, missing: [] },
  ];
}
