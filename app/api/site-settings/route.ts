// app/api/site-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getHeroMedia, getLogoUrl } from "@/lib/site/hero";
import { getContactSettings } from "@/lib/site/settings";
import { getLocalized } from "@/lib/i18n/getLocalized";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") ?? "es";

  const [heroMedia, logoUrl, contact] = await Promise.all([
    getHeroMedia(),
    getLogoUrl(),
    getContactSettings(),
  ]);

  return NextResponse.json({
    // Slide 1 URL kept for existing callers
    heroUrl: heroMedia[1]?.url ?? null,
    // { 1: {url, type} | null, 2: ..., 3: ... }
    heroMedia,
    logoUrl,
    ...contact,
    features: contact.features,
    stayInfo: contact.stayInfo,
    aboutTitle: getLocalized(contact.aboutTitle, locale),
    aboutText: getLocalized(contact.aboutText, locale),

    heroTitle: getLocalized(contact.heroTitle, locale),
    heroSubtitle: getLocalized(contact.heroSubtitle, locale),
    heroButtonText: getLocalized(contact.heroButtonText, locale),

    hero2Title: getLocalized(contact.hero2Title, locale),
    hero2Subtitle: getLocalized(contact.hero2Subtitle, locale),
    hero2ButtonText: getLocalized(contact.hero2ButtonText, locale),

    hero3Title: getLocalized(contact.hero3Title, locale),
    hero3Subtitle: getLocalized(contact.hero3Subtitle, locale),
    hero3ButtonText: getLocalized(contact.hero3ButtonText, locale),

    emailSubject: getLocalized(contact.emailSubject, locale),
    emailIntro: getLocalized(contact.emailIntro, locale),
  });
}
