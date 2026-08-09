// app/api/site-settings/route.ts
//
// REPLACES the previous version. Now delegates the contact/map query to
// the shared helper instead of an inline query — same DRY reasoning as
// the hero image split.

import { NextResponse } from "next/server";
import { getHeroUrl } from "@/lib/site/hero";
import { getContactSettings } from "@/lib/site/settings";

export async function GET() {
  const [heroUrl, contact] = await Promise.all([
    getHeroUrl(),
    getContactSettings(),
  ]);

  return NextResponse.json({
    heroUrl,
    ...contact,
  });
}
