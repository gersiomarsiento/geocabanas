// app/components/HeroSlides.tsx
//
// Builds the homepage slider from the DB. Slide 1 falls back to the
// default image; slides 2 and 3 are skipped if they have no media.

import { getLocale } from "next-intl/server";
import { getHeroMedia } from "@/lib/site/hero";
import { getContactSettings } from "@/lib/site/settings";
import { getLocalized } from "@/lib/i18n/getLocalized";
import HeroSlider from "./HeroSlider";
import HeroImageClient from "./HeroImageClient";

export default async function HeroSlides() {
  const locale = await getLocale();
  const [media, c] = await Promise.all([getHeroMedia(), getContactSettings()]);

  const slides = [
    {
      id: 1,
      media: media[1] ?? { url: "/images/hero.webp", type: "image" as const },
      title: c.heroTitle,
      subtitle: c.heroSubtitle,
      buttonText: c.heroButtonText,
      buttonHref: c.heroButtonHref,
    },
    {
      id: 2,
      media: media[2],
      title: c.hero2Title,
      subtitle: c.hero2Subtitle,
      buttonText: c.hero2ButtonText,
      buttonHref: c.hero2ButtonHref,
    },
    {
      id: 3,
      media: media[3],
      title: c.hero3Title,
      subtitle: c.hero3Subtitle,
      buttonText: c.hero3ButtonText,
      buttonHref: c.hero3ButtonHref,
    },
  ];

  const nodes = slides.flatMap((s) =>
    s.media
      ? [
          <HeroImageClient
            key={s.id}
            heroUrl={s.media.url}
            mediaType={s.media.type}
            priority={s.id === 1}
            heroTitle={getLocalized(s.title, locale) || null}
            heroSubtitle={getLocalized(s.subtitle, locale) || null}
            heroButtonHref={s.buttonHref}
            heroButtonText={getLocalized(s.buttonText, locale) || null}
          />,
        ]
      : [],
  );

  return <HeroSlider slides={nodes} />;
}
