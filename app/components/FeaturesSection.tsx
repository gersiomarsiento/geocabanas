"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import { getFeatureIcon } from "@/lib/site/features";
import "swiper/css";
import "swiper/css/effect-cards";

type Feature = { icon: string; label: string };
type StayItem = { value: string; label: string };

const STAY_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

export default function FeaturesSection({
  commonAreas,
  features,
  stayInfo,
  title,
}: {
  commonAreas: { id: string; url: string }[];
  features: Feature[];
  stayInfo: StayItem[];
  title: string;
}) {
  const stayCount = stayInfo.length;
  // first index of the last row on mobile (2 columns), so it has no bottom border
  const lastRowStart = stayCount % 2 === 0 ? stayCount - 2 : stayCount - 1;

  return (
    <section
      aria-labelledby="highlights-title"
      className="w-full bg-gradient-1 px-3 py-10 md:px-6 md:py-16"
    >
      <div className="mx-auto max-w-354">
        <div className="mx-auto mb-8 max-w-xl md:max-w-3xl text-center md:mb-12">
          <h2
            id="highlights-title"
            className="text-xl font-semibold text-white md:text-2xl"
          >
            {title}
          </h2>
        </div>

        <ul className="mx-auto mb-10 flex max-w-3xl flex-wrap justify-center gap-y-6 text-center md:mb-14">
          {features.map(({ icon, label }, i) => {
            const Icon = getFeatureIcon(icon);
            return (
              <li
                key={`${icon}-${i}`}
                className="flex w-1/3 flex-col items-center gap-2 px-1 md:w-1/6"
              >
                <Icon className="h-6 w-6 text-white md:h-7 md:w-7" />
                <span className="text-xs leading-tight text-white/80 md:text-sm">
                  {label}
                </span>
              </li>
            );
          })}
        </ul>

        {stayCount > 0 && (
          <div className="relative mx-auto mb-10 max-w-70 md:max-w-3xl md:mb-16">
            <div
              className={`grid grid-cols-2 rounded-2xl bg-primary-50 py-3 md:py-6 shadow-md ${
                STAY_COLS[stayCount] ?? "md:grid-cols-4"
              }`}
            >
              {stayInfo.map(({ value, label }, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center gap-1 border-dashed border-primary/30 px-4 py-4 md:py-0 ${
                    i < lastRowStart ? "border-b md:border-b-0" : ""
                  } ${i < stayCount - 1 ? "md:border-r" : ""}`}
                >
                  <span className="font-gotham text-2xl font-semibold text-primary md:text-3xl">
                    {value}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-foreground/60 md:text-sm md:normal-case md:tracking-normal">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {commonAreas.length > 0 && (
          <Swiper
            effect="cards"
            grabCursor
            modules={[EffectCards]}
            initialSlide={Math.floor((commonAreas.length - 1) / 2)}
            cardsEffect={{
              perSlideOffset: 40,
              perSlideRotate: 3,
              slideShadows: false,
            }}
            className="shared-spaces-swiper mx-auto w-64 md:w-100"
          >
            {commonAreas.map(({ id, url }) => (
              <SwiperSlide key={id} className="polaroid-slide">
                <div className="relative h-full w-full bg-zinc-200">
                  <Image
                    src={url}
                    alt={`Espacios comunes ${id}`}
                    fill
                    sizes="(min-width: 768px) 400px, 256px"
                    className="object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      <style jsx global>{`
        .shared-spaces-swiper {
          height: 20rem;
        }
        @media (min-width: 768px) {
          .shared-spaces-swiper {
            height: 31rem;
          }
        }
        .shared-spaces-swiper .polaroid-slide {
          background: #fdfcf8;
          padding: 0.75rem 0.75rem 3rem;
          border-radius: 0.125rem;
          box-shadow: 0 6px 18px rgb(0 0 0 / 0.35);
        }
        @media (min-width: 768px) {
          .shared-spaces-swiper .polaroid-slide {
            padding: 1rem 1rem 4rem;
          }
        }
      `}</style>
    </section>
  );
}
