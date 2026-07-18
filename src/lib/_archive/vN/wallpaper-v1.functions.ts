/** HAPPY UVE v4.0 — Wallpaper engine catalog (stub). */
import { createServerFn } from "@tanstack/react-start";

export type WallpaperCategory =
  | "workspace" | "nature" | "space" | "abstract" | "technology"
  | "luxury" | "spiritual" | "custom" | "ai-generated" | "animated" | "video";

export interface Wallpaper {
  id: string;
  name: string;
  category: WallpaperCategory;
  animated?: boolean;
}

export const WALLPAPERS: Wallpaper[] = [
  { id: "corporate-office", name: "Corporate Office", category: "workspace" },
  { id: "executive-boardroom", name: "Executive Boardroom", category: "workspace" },
  { id: "luxury-workspace", name: "Luxury Workspace", category: "workspace" },
  { id: "ai-laboratory", name: "AI Laboratory", category: "technology" },
  { id: "library", name: "Library", category: "workspace" },
  { id: "university", name: "University", category: "workspace" },
  { id: "factory", name: "Factory Floor", category: "workspace" },
  { id: "manufacturing-plant", name: "Manufacturing Plant", category: "workspace" },
  { id: "hospital", name: "Hospital", category: "workspace" },
  { id: "restaurant", name: "Restaurant", category: "workspace" },
  { id: "cafe", name: "Café", category: "workspace" },
  { id: "modern-office", name: "Modern Office", category: "workspace" },
  { id: "nature", name: "Nature", category: "nature" },
  { id: "mountains", name: "Mountains", category: "nature" },
  { id: "ocean", name: "Ocean", category: "nature" },
  { id: "galaxy", name: "Galaxy", category: "space", animated: true },
  { id: "space", name: "Deep Space", category: "space", animated: true },
  { id: "abstract", name: "Abstract", category: "abstract" },
  { id: "minimal", name: "Minimal", category: "abstract" },
  { id: "technology", name: "Technology", category: "technology" },
  { id: "cyber", name: "Cyber", category: "technology", animated: true },
  { id: "luxury-black", name: "Luxury Black", category: "luxury" },
  { id: "gold-abstract", name: "Gold Abstract", category: "luxury" },
  { id: "islamic-geometry", name: "Islamic Geometry", category: "spiritual" },
  { id: "arabic-pattern", name: "Arabic Pattern", category: "spiritual" },
  { id: "mosque-interior", name: "Mosque Interior", category: "spiritual" },
  { id: "kaaba-inspired", name: "Kaaba Inspired", category: "spiritual" },
  { id: "calligraphy", name: "Calligraphy", category: "spiritual" },
];

export const listWallpapers = createServerFn({ method: "GET" }).handler(async () => ({
  wallpapers: WALLPAPERS,
  categories: [
    "workspace","nature","space","abstract","technology",
    "luxury","spiritual","custom","ai-generated","animated","video",
  ] satisfies WallpaperCategory[],
}));
