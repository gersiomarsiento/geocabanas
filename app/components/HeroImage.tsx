// app/components/HeroImage.tsx
//
// No "use client" — this is now a server component, resolved during
// rendering before anything reaches the browser. There's no fallback
// swap to see because there's only ever one image sent, period.

import Image from "next/image";
import { getHeroUrl } from "@/lib/site/hero";

export default async function HeroImage() {
  const heroUrl = await getHeroUrl();

  return (
    <Image
      src={heroUrl ?? "/images/hero.jpg"}
      alt="Imagen principal"
      fill
      priority
      sizes="100vw"
      className="object-cover"
    />
  );
}
