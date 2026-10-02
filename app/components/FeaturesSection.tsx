"use client";

import Image from "next/image";
import {
  WavesHorizontal,
  Parasol,
  FlameKindling,
  Wifi,
  SquareParking,
  PawPrint,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";

const features = [
  { icon: WavesHorizontal, label: "Piscina" },
  { icon: Parasol, label: "A pasos de la playa" },
  { icon: Wifi, label: "WiFi en todo el predio" },
  { icon: FlameKindling, label: "Parrillero" },
  { icon: SquareParking, label: "Estacionamiento" },
  { icon: PawPrint, label: "Pet friendly" },
];

const stayInfo = [
  { value: "3 PM", label: "Check-in" },
  { value: "10 AM", label: "Check-out" },
  { value: "50%", label: "Depósito" },
  { value: "2", label: "Mín. noches" },
];

export default function FeaturesSection({
  commonAreas,
}: {
  commonAreas: { id: string; url: string }[];
}) {
  return (
    <section
      aria-labelledby="highlights-title"
      className="w-full bg-gradient-1 px-3 py-10 md:px-6 md:py-16"
    >
      <div className="mx-auto max-w-354">
        {/* Header */}
        <div className="mx-auto mb-8 max-w-xl md:max-w-3xl text-center md:mb-12">
          <h2
            id="highlights-title"
            className="text-xl font-semibold text-white md:text-2xl"
          >
            LO QUE VAS A ENCONTRAR
          </h2>
        </div>

        {/* Features — plain row/grid, icon + label, no card chrome */}
        <ul className="mx-auto mb-10 grid max-w-3xl grid-cols-3 gap-y-6 text-center md:mb-14 md:grid-cols-6 md:gap-x-4">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-2 px-1">
              <Icon className="h-6 w-6 text-white md:h-7 md:w-7" />
              <span className="text-xs leading-tight text-white/80 md:text-sm">
                {label}
              </span>
            </li>
          ))}
        </ul>

        {/* Stay info — ticket-stub treatment */}
        <div className="relative mx-auto mb-10 max-w-3xl md:mb-16">
          <div className="grid grid-cols-2 rounded-2xl bg-primary-50 py-6 shadow-md md:grid-cols-4">
            {stayInfo.map(({ value, label }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center justify-center gap-1 border-dashed border-primary/30 px-4 py-4 md:py-0 ${
                  i < 2 ? "border-b md:border-b-0" : ""
                } ${i < stayInfo.length - 1 ? "md:border-r" : ""}`}
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

        {/* Shared spaces — asymmetric mosaic, distinct from the cabin gallery */}
        {commonAreas.length > 0 && (
          <Swiper
            effect="cards"
            grabCursor
            modules={[EffectCards]}
            initialSlide={Math.floor((commonAreas.length - 1) / 2)}
            cardsEffect={{
              perSlideOffset: 40,
              perSlideRotate: 3, // each card behind tilts a bit, like a scattered pile
              slideShadows: false, // the built-in shadows would darken the white frames
            }}
            className="shared-spaces-swiper mx-auto w-64 md:w-100"
          >
            {commonAreas.map(({ id, url }) => (
              <SwiperSlide key={id} className="polaroid-slide">
                <div className="relative h-full w-full bg-zinc-200">
                  <Image
                    src={url}
                    alt="Espacios comunes"
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
      {/* Swiper's cards effect needs the slide (and swiper el) to have an explicit height */}
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
          background: #fdfcf8; /* slightly warm white, reads as photo paper */
          padding: 0.75rem 0.75rem 3rem; /* thick bottom edge */
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
