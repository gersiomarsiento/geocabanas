"use client";

// app/components/PropertyCarousel.tsx
//
// Fills its parent (absolute inset-0): the parent decides the size.
// md+: vertical thumbnail strip on the left + main slider.
// mobile: main slider only (swipe + counter).

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
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

  // Whether the thumbnail strip has more slides above / below the visible area
  const [edges, setEdges] = useState({ start: true, end: true });

  function syncEdges(s: SwiperType) {
    setEdges((prev) =>
      prev.start === s.isBeginning && prev.end === s.isEnd
        ? prev
        : { start: s.isBeginning, end: s.isEnd },
    );
  }

  // Keep the active thumbnail in view when the main slider changes.
  useEffect(() => {
    if (!thumbs || thumbs.destroyed) return;
    const slide = thumbs.slides[activeIndex] as HTMLElement | undefined;
    if (!slide) return;

    const viewStart = -thumbs.translate;
    const viewEnd = viewStart + thumbs.size;
    const slideStart = slide.offsetTop;
    const slideEnd = slideStart + slide.offsetHeight;

    if (slideStart < viewStart || slideEnd > viewEnd) {
      thumbs.slideTo(Math.max(activeIndex - 1, 0));
    }
  }, [activeIndex, thumbs]);

  function scrollThumbs(direction: 1 | -1) {
    if (!thumbs) return;
    thumbs.slideTo(
      Math.min(
        Math.max(thumbs.activeIndex + direction * 3, 0),
        images.length - 1,
      ),
    );
  }

  if (images.length === 0) return null;
  const multiple = images.length > 1;

  return (
    <div className="absolute inset-0 flex">
      {/* Thumbnails (desktop only) */}
      {multiple && (
        <div className="relative hidden w-28 shrink-0 bg-white md:block xl:w-34">
          {/* Absolute box = a definite height, whatever the slides add up to,
              so Swiper knows when the content overflows and can scroll. */}
          <div className="absolute inset-y-0 inset-x-2">
            <Swiper
              onSwiper={(s) => {
                setThumbs(s);
                syncEdges(s);
              }}
              onProgress={syncEdges}
              onResize={syncEdges}
              onUpdate={syncEdges}
              direction="vertical"
              slidesPerView="auto"
              spaceBetween={8}
              watchSlidesProgress
              modules={[Thumbs]}
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

          {/* "There's more" arrows: only visible while there is more to see */}
          {!edges.start && (
            <button
              type="button"
              onClick={() => scrollThumbs(-1)}
              aria-label={t("fotoAnterior")}
              className="absolute left-1/2 top-1 z-10 flex -translate-x-1/2 -rotate-90 items-center rounded-full text-primary shadow transition-colors hover:bg-white"
            >
              <CaretIcon />
            </button>
          )}
          {!edges.end && (
            <button
              type="button"
              onClick={() => scrollThumbs(1)}
              aria-label={t("fotoSiguiente")}
              className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 rotate-90 items-center rounded-full text-primary shadow transition-colors hover:bg-white"
            >
              <CaretIcon />
            </button>
          )}
        </div>
      )}

      {/* Main slider */}
      <div
        className={`relative min-w-0 flex-1 ${multiple ? "md:mr-2" : ""}`}
      >
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
              className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full text-primary-foreground transition-colors hover:bg-white disabled:cursor-default! disabled:bg-transparent disabled:opacity-10"
            >
              <CaretIcon className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => main?.slideNext()}
              disabled={activeIndex === images.length - 1}
              aria-label={t("fotoSiguiente")}
              className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full text-primary-foreground transition-colors hover:bg-white disabled:cursor-default! disabled:bg-transparent disabled:opacity-10"
            >
              <CaretIcon />
            </button>

            <div className="absolute right-2 top-2 z-10 rounded-full bg-primary/60 px-2 py-0.5 text-xs font-medium text-primary-foreground md:hidden">
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