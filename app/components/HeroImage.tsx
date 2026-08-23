// app/components/HeroImage.tsx
//
import { getLocale } from "next-intl/server";
import { getHeroUrl } from "@/lib/site/hero";
import { getContactSettings } from "@/lib/site/settings";
import { getLocalized } from "@/lib/i18n/getLocalized";
import HeroImageClient from "./HeroImageClient";

export default async function HeroImage() {
  const locale = await getLocale();
  const heroUrl = await getHeroUrl();
  const { heroTitle, heroSubtitle, heroButtonHref, heroButtonText } =
    await getContactSettings();

  return (
    <HeroImageClient
      heroUrl={heroUrl ?? "/images/hero.jpg"}
      heroTitle={getLocalized(heroTitle, locale) || null}
      heroSubtitle={getLocalized(heroSubtitle, locale) || null}
      heroButtonHref={heroButtonHref}
      heroButtonText={getLocalized(heroButtonText, locale) || null}
    />
  );
}
