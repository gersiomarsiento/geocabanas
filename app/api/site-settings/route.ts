import { NextRequest, NextResponse } from "next/server";
import { getHeroUrl, getLogoUrl } from "@/lib/site/hero";
import { getContactSettings } from "@/lib/site/settings";
import { getLocalized } from "@/lib/i18n/getLocalized";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") ?? "es";

  const [heroUrl, logoUrl, contact] = await Promise.all([
    getHeroUrl(),
    getLogoUrl(),
    getContactSettings(),
  ]);

  return NextResponse.json({
    heroUrl,
    logoUrl,
    ...contact,
    aboutTitle: getLocalized(contact.aboutTitle, locale),
    aboutText: getLocalized(contact.aboutText, locale),
    heroTitle: getLocalized(contact.heroTitle, locale),
    heroSubtitle: getLocalized(contact.heroSubtitle, locale),
    heroButtonText: getLocalized(contact.heroButtonText, locale),
  });
}
