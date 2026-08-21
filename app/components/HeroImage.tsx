// app/components/HeroImage.tsx
//
// Server component: resolves the hero data before it reaches the browser.
// The actual <img> loading/error state lives in HeroImageClient, since
// that part needs to run in the browser.

import { getHeroUrl } from "@/lib/site/hero";
import { getContactSettings } from "@/lib/site/settings";
import HeroImageClient from "./HeroImageClient";

export default async function HeroImage() {
  const heroUrl = await getHeroUrl();
  const { heroTitle, heroSubtitle, heroButtonHref, heroButtonText } =
    await getContactSettings();

  return (
    <HeroImageClient
      heroUrl={heroUrl ?? "/images/hero.jpg"}
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      heroButtonHref={heroButtonHref}
      heroButtonText={heroButtonText}
    />
  );
}
