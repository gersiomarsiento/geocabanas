// lib/site/hero.ts
//
// Extracted from app/api/site-settings/route.ts so both the public API
// (used client-side by the admin's SiteHeroCard) and the server-rendered
// homepage hero (next step) share one source of truth instead of two
// copies of the same bucket-listing logic drifting apart over time.

import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "property-images";
const LOGO_PATH = "site/logo";

export type HeroSlideId = 1 | 2 | 3;
export type HeroMediaType = "image" | "video";

export interface HeroMedia {
  url: string;
  type: HeroMediaType;
}

export const HERO_PATHS: Record<HeroSlideId, string> = {
  1: "site/hero",
  2: "site/hero-2",
  3: "site/hero-3",
};

export const HERO_MEDIA_TYPE_COLUMNS: Record<HeroSlideId, string> = {
  1: "hero_media_type",
  2: "hero2_media_type",
  3: "hero3_media_type",
};

type StoredFile = {
  name: string;
  updated_at?: string | null;
  created_at?: string | null;
};

function buildUrl(path: string, file: StoredFile): string {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  const version = file.updated_at ?? file.created_at ?? "";
  return `${data.publicUrl}?v=${encodeURIComponent(version)}`;
}

export async function getHeroMedia(): Promise<
  Record<HeroSlideId, HeroMedia | null>
> {
  const [listRes, settingsRes] = await Promise.all([
    supabaseAdmin.storage.from(BUCKET).list("site"),
    supabaseAdmin
      .from("site_settings")
      .select("hero_media_type, hero2_media_type, hero3_media_type")
      .eq("id", "singleton")
      .single(),
  ]);

  const result: Record<HeroSlideId, HeroMedia | null> = {
    1: null,
    2: null,
    3: null,
  };

  if (listRes.error) {
    console.error("Failed to list site hero media:", listRes.error);
    return result;
  }

  const files = (listRes.data ?? []) as StoredFile[];
  const settings = (settingsRes.data ?? {}) as Record<string, string | null>;

  for (const id of [1, 2, 3] as const) {
    const path = HERO_PATHS[id];
    const file = files.find((f) => f.name === path.replace("site/", ""));
    if (!file) continue;

    const rawType = settings[HERO_MEDIA_TYPE_COLUMNS[id]];
    result[id] = {
      url: buildUrl(path, file),
      type: rawType === "video" ? "video" : "image",
    };
  }

  return result;
}

// Kept for existing callers (HeroImage, /api/site-settings).
export async function getHeroUrl(): Promise<string | null> {
  const media = await getHeroMedia();
  return media[1]?.url ?? null;
}

export async function getLogoUrl(): Promise<string | null> {
  const { data: files, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list("site");
  if (error) return null;
  const logoFile = files?.find((f) => f.name === "logo");
  if (!logoFile) return null;
  return buildUrl(LOGO_PATH, logoFile);
}
