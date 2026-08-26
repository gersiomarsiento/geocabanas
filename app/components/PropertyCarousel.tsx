"use client";

// app/components/PropertyCarousel.tsx

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { CaretIcon } from "./icons";
import ImageLightbox from "./ImageLightbox";

interface CarouselImage {
  id: string;
  url: string;
}

export default function PropertyCarousel({
  images,
}: {
  images: CarouselImage[];
}) {
  const t = useTranslations("Carousel");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Tracks whichever slide is most visible, so the counter stays correct
  // whether the visitor drags, swipes, or clicks an arrow — no manual
  // index math tied to any one input method.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries.reduce(
          (best, entry) =>
            entry.intersectionRatio > (best?.intersectionRatio ?? 0)
              ? entry
              : best,
          entries[0],
        );
        if (mostVisible?.isIntersecting) {
          setActiveIndex(
            Number((mostVisible.target as HTMLElement).dataset.index),
          );
        }
      },
      { root: scroller, threshold: 0.6 },
    );

    scroller
      .querySelectorAll("[data-index]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [images]);

  function scrollToIndex(index: number) {
    const scroller = scrollerRef.current;
    const slide = scroller?.children[index] as HTMLElement | undefined;

    if (!scroller || !slide) return;

    scroller.scrollTo({
      left: slide.offsetLeft,
      behavior: "smooth",
    });
  }

  // Mouse drag-to-scroll for desktop — touch devices already get native
  // momentum scrolling from scroll-snap below, no JS needed for them.
  const dragState = useRef<{ startX: number; startScrollLeft: number } | null>(
    null,
  );
  const didDragRef = useRef(false);
  const pointerDownRef = useRef<{ x: number; index: number | null } | null>(
    null,
  );
  function handlePointerDown(e: React.PointerEvent) {
    const slide = (e.target as HTMLElement).closest(
      "[data-index]",
    ) as HTMLElement | null;
    pointerDownRef.current = {
      x: e.clientX,
      index: slide ? Number(slide.dataset.index) : null,
    };
    didDragRef.current = false;

    if (e.pointerType !== "mouse") return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    dragState.current = {
      startX: e.clientX,
      startScrollLeft: scroller.scrollLeft,
    };
    scroller.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current || !scrollerRef.current) return;
    const delta = e.clientX - dragState.current.startX;
    if (Math.abs(delta) > 5) didDragRef.current = true;
    scrollerRef.current.scrollLeft = dragState.current.startScrollLeft - delta;
  }

  function handlePointerUp(e: React.PointerEvent) {
    dragState.current = null;

    const down = pointerDownRef.current;
    pointerDownRef.current = null;
    if (!down || down.index === null) return;

    const movedX = Math.abs(e.clientX - down.x);
    const wasTap = !didDragRef.current && movedX < 10;

    if (wasTap) {
      setLightboxIndex(down.index);
    }
  }

  if (images.length === 0) return null;

  return (
    <div className="relative w-full h-full">
      <div
        ref={scrollerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          dragState.current = null;
          pointerDownRef.current = null;
        }}
        className="flex w-full h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] scrollbar-none cursor-pointer select-none  [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            data-index={index}
            className="relative aspect-4/3 w-full shrink-0 snap-start"
          >
            <Image
              src={image.url}
              alt=""
              fill
              draggable={true}
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.max(activeIndex - 1, 0))}
            disabled={activeIndex === 0}
            aria-label={t("fotoAnterior")}
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full transition-colors text-primary-foreground hover:bg-primary disabled:bg-transparent disabled:cursor-default! disabled:opacity-10"
          >
            <CaretIcon className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() =>
              scrollToIndex(Math.min(activeIndex + 1, images.length - 1))
            }
            disabled={activeIndex === images.length - 1}
            aria-label={t("fotoSiguiente")}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full transition-colors text-primary-foreground hover:bg-primary disabled:bg-transparent disabled:cursor-default! disabled:opacity-10"
          >
            <CaretIcon />
          </button>

          <div className="absolute right-2 top-2 rounded-full bg-primary/60 px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {activeIndex + 1} / {images.length}
          </div>
        </>
      )}
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
