"use client";

import { useState } from "react";
import Image from "next/image";

interface HeroImageClientProps {
  heroUrl: string;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroButtonHref?: string | null;
  heroButtonText?: string | null;
}

export default function HeroImageClient({
  heroUrl,
  heroTitle,
  heroSubtitle,
  heroButtonHref,
  heroButtonText,
}: HeroImageClientProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  return (
    <>
      {status !== "error" && (
        <Image
          src={heroUrl}
          alt="Imagen principal"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}

      {/* Curtain: covers the hero while the image loads/fails, then rises
          out of view once it's ready. Stays down permanently on error so
          we never show a broken image. */}
      <div
        aria-hidden={status === "loaded"}
        className={`absolute inset-0 z-20 flex items-center justify-center bg-primary transition-transform duration-700 ease-in-out ${
          status === "loaded" ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {status === "loading" && (
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
      </div>

      {(heroTitle || heroSubtitle || heroButtonHref) && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end pb-20 text-center text-primary-foreground">
          <div className="text-wrapper flex flex-col items-center">
            {heroTitle && (
              <h1 className="text-3xl font-bold md:text-5xl">{heroTitle}</h1>
            )}
            {heroSubtitle && (
              <p className="mt-2 text-lg md:text-xl">{heroSubtitle}</p>
            )}
            <a
              href={heroButtonHref ?? "#reservar-button"}
              className="w-fit scroll-smooth z-10 bg-background text-sm md:text-lg font-bold text-primary py-2 px-4 border border-primary rounded-md mt-8 hover:bg-accent hover:text-white hover:border-transparent transition"
            >
              {heroButtonText ?? "RESERVAR"}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
