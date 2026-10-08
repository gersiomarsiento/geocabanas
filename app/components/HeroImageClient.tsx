"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface HeroImageClientProps {
  heroUrl: string;
  mediaType?: "image" | "video";
  priority?: boolean;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroButtonHref?: string | null;
  heroButtonText?: string | null;
}

export default function HeroImageClient({
  heroUrl,
  mediaType = "image",
  priority = false,
  heroTitle,
  heroSubtitle,
  heroButtonHref,
  heroButtonText,
}: HeroImageClientProps) {
  const t = useTranslations("Hero");
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  // The video may finish loading before React hydrates, so its load events
  // are missed. Check its state once on mount.
  useEffect(() => {
    if (mediaType !== "video") return;
    const v = videoRef.current;
    if (!v) return;

    v.muted = true; // React's `muted` prop doesn't always set the attribute
    if (v.error) {
      setStatus("error");
      return;
    }
    if (v.readyState >= 2) setStatus("loaded");
    v.play().catch(() => {});
  }, [mediaType, heroUrl]);

  return (
    <>
      {status !== "error" &&
        (mediaType === "video" ? (
          <video
            ref={videoRef}
            src={heroUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label={t("imagenPrincipal")}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            onLoadedData={() => setStatus("loaded")}
            onCanPlay={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        ) : (
          <Image
            src={heroUrl}
            alt={t("imagenPrincipal")}
            fill
            priority={priority}
            sizes="100vw"
            className="object-cover opacity-60"
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        ))}

      <div
        aria-hidden={status !== "loading"}
        className={`absolute inset-0 z-20 flex items-center justify-center bg-primary transition-transform duration-700 ease-in-out ${
          status !== "loading" ? "-translate-y-full" : "translate-y-0"
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
              {heroButtonText ?? t("botonReservarDefault")}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
