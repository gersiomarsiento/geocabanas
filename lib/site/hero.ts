// lib/site/hero.ts
//
// Extracted from app/api/site-settings/route.ts so both the public API
// (used client-side by the admin's SiteHeroCard) and the server-rendered
// homepage hero (next step) share one source of truth instead of two
// copies of the same bucket-listing logic drifting apart over time.

import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "property-images";
const HERO_PATH = "site/hero";
const LOGO_PATH = "site/logo";

export async function getLogoUrl(): Promise<string | null> {
  const { data: files, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list("site");
  if (error) return null;
  const logoFile = files?.find((f) => f.name === "logo");
  if (!logoFile) return null;
  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(LOGO_PATH);
  const version = logoFile.updated_at ?? logoFile.created_at ?? "";
  return `${urlData.publicUrl}?v=${encodeURIComponent(version)}`;
}

export async function getHeroUrl(): Promise<string | null> {
  const { data: files, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list("site");

  if (error) {
    console.error("Failed to list site hero:", error);
    return null;
  }

  const heroFile = files?.find((f) => f.name === "hero");
  if (!heroFile) return null;

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(HERO_PATH);
  const version = heroFile.updated_at ?? heroFile.created_at ?? "";

  return `${urlData.publicUrl}?v=${encodeURIComponent(version)}`;
}
