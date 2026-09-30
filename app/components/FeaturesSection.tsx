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

const sharedSpaces = [
  {
    src: "/images/beach.webp",
    alt: "Piscina compartida",
  },
  {
    src: "/images/hero-image.jpg",
    alt: "Piscina compartida",
  },
  {
    src: "/images/ocean.webp",
    alt: "Deck y reposeras",
  },
  {
    src: "/images/hero.webp",
    alt: "Jardín y parrillero",
  },
  {
    src: "/images/bg_dark_mesh.webp",
    alt: "Deck y reposeras",
  },
  {
    src: "/images/bg_light_mesh.webp",
    alt: "Jardín y parrillero",
  },
  {
    src: "/images/hero.jpg",
    alt: "Piscina compartida",
  },
];

export default function FeaturesSection() {
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
          <div className="grid grid-cols-2 divide-y divide-dashed divide-primary/30 rounded-2xl bg-primary-50 py-6 shadow-md md:grid-cols-4 md:divide-x md:divide-y-0">
            {stayInfo.map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-1 px-4 py-4 md:py-0"
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
        <div>
          {/* <div className="grid grid-cols-2 grid-rows-2 gap-3 md:gap-4 md:h-110">
            {sharedSpaces.map(({ src, alt, className }) => (
              <div key={src} className={`relative overflow-hidden rounded-xl ${className ?? ""}`}>
                <Image src={src} alt={alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div> */}
          <Swiper
            effect="cards"
            grabCursor
            modules={[EffectCards]}
            initialSlide={3}
            cardsEffect={{ perSlideOffset: 50, perSlideRotate: 0 }}
            className="shared-spaces-swiper mx-auto w-64 md:w-100"
          >
            {sharedSpaces.map(({ src, alt }) => (
              <SwiperSlide key={src} className="overflow-hidden rounded-2xl">
                <div className="relative h-full w-full">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="320px"
                    className="object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      {/* Swiper's cards effect needs the slide (and swiper el) to have an explicit height */}
      <style jsx global>{`
        .shared-spaces-swiper {
          height: 16rem;
        }
        @media (min-width: 768px) {
          .shared-spaces-swiper {
            height: 26rem;
          }
        }
        .shared-spaces-swiper .swiper-slide {
          border-radius: 1rem;
        }
      `}</style>
    </section>
  );
}
