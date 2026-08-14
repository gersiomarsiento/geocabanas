// app/components/HeroImage.tsx
//
// No "use client" — this is now a server component, resolved during
// rendering before anything reaches the browser. There's no fallback
// swap to see because there's only ever one image sent, period.

import Image from "next/image";
import { getHeroUrl } from "@/lib/site/hero";
import { getContactSettings } from "@/lib/site/settings";

export default async function HeroImage() {
  const heroUrl = await getHeroUrl();
  const { heroTitle, heroSubtitle, heroButtonHref, heroButtonText } =
    await getContactSettings();

  return (
    <>
      <Image
        src={heroUrl ?? "/images/hero.jpg"}
        alt="Imagen principal"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-70"
      />
      {(heroTitle || heroSubtitle || heroButtonHref) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white">
          {heroTitle && (
            <h2 className="text-3xl font-bold md:text-5xl">{heroTitle}</h2>
          )}
          {heroSubtitle && (
            <p className="mt-2 text-lg md:text-xl">{heroSubtitle}</p>
          )}
          <a
            href={heroButtonHref ?? "#reservar-button"}
            className="scroll-smooth z-10 bg-white text-sm md:text-lg font-bold text-black py-2 px-4 border border-black rounded-md mt-8"
          >
            {heroButtonText ?? "RESERVAR"}
          </a>
        </div>
      )}
    </>
  );
}
