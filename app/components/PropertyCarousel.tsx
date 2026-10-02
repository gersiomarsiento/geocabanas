"use client";

// app/components/PropertyCarousel.tsx
//
// Fills its parent (absolute inset-0): the parent decides the size.
// md+: vertical thumbnail strip on the left + main slider.
// mobile: main slider only (swipe + counter).

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/thumbs";

import { CaretIcon } from "./icons";
import ImageLightbox from "./ImageLightbox";

interface CarouselImage {
  id: string;
  url: string;
}

export default function PropertyCarousel({
  images,
  alt = "",
}: {
  images: CarouselImage[];
  alt?: string;
}) {
  const t = useTranslations("Carousel");
  const [main, setMain] = useState<SwiperType | null>(null);
  const [thumbs, setThumbs] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;
  const multiple = images.length > 1;

  return (
    <div className="absolute inset-0 flex">
      {/* Thumbnails (desktop only) */}
      {multiple && (
        <div className="hidden min-h-0 w-28 xl:w-34 shrink-0 bg-white px-2 md:block">
          <Swiper
            onSwiper={setThumbs}
            direction="vertical"
            slidesPerView="auto"
            spaceBetween={8}
            freeMode
            watchSlidesProgress
            modules={[FreeMode, Thumbs]}
            className="h-full"
          >
            {images.map((image) => (
              <SwiperSlide
                key={image.id}
                className="h-auto! cursor-pointer opacity-50 transition-opacity hover:opacity-80 [&.swiper-slide-thumb-active]:opacity-100"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover bg-primary"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
      {/* Main slider */}
      <div className={`relative min-w-0 flex-1 ${images.length > 1 ? "md:mr-2": ""}`}>
        <Swiper
          onSwiper={setMain}
          onSlideChange={(s) => setActiveIndex(s.activeIndex)}
          thumbs={{ swiper: thumbs && !thumbs.destroyed ? thumbs : null }}
          modules={[Thumbs]}
          className="h-full"
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id}>
              {/* Swiper suppresses click after a drag, so this only fires on a real tap */}
              <div
                className="relative h-full w-full cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                <Image
                  src={image.url}
                  alt={alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 100vw, 990px"
                  className="object-cover bg-primary"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {multiple && (
          <>
            <button
              type="button"
              onClick={() => main?.slidePrev()}
              disabled={activeIndex === 0}
              aria-label={t("fotoAnterior")}
              className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full text-primary-foreground transition-colors hover:bg-primary disabled:cursor-default! disabled:bg-transparent disabled:opacity-10"
            >
              <CaretIcon className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => main?.slideNext()}
              disabled={activeIndex === images.length - 1}
              aria-label={t("fotoSiguiente")}
              className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full text-primary-foreground transition-colors hover:bg-primary disabled:cursor-default! disabled:bg-transparent disabled:opacity-10"
            >
              <CaretIcon />
            </button>

            <div className="md:hidden absolute right-2 top-2 z-10 rounded-full bg-primary/60 px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}