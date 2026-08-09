"use client";

// app/components/PropertyCarousel.tsx

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface CarouselImage {
  id: string;
  url: string;
}

export default function PropertyCarousel({ images }: { images: CarouselImage[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Tracks whichever slide is most visible, so the counter stays correct
  // whether the visitor drags, swipes, or clicks an arrow — no manual
  // index math tied to any one input method.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries.reduce(
          (best, entry) => (entry.intersectionRatio > (best?.intersectionRatio ?? 0) ? entry : best),
          entries[0],
        );
        if (mostVisible?.isIntersecting) {
          setActiveIndex(Number((mostVisible.target as HTMLElement).dataset.index));
        }
      },
      { root: scroller, threshold: 0.6 },
    );

    scroller.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [images]);

  function scrollToIndex(index: number) {
    const scroller = scrollerRef.current;
    const slide = scroller?.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start" });
  }

  // Mouse drag-to-scroll for desktop — touch devices already get native
  // momentum scrolling from scroll-snap below, no JS needed for them.
  const dragState = useRef<{ startX: number; startScrollLeft: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    dragState.current = { startX: e.clientX, startScrollLeft: scroller.scrollLeft };
    scroller.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current || !scrollerRef.current) return;
    const delta = e.clientX - dragState.current.startX;
    scrollerRef.current.scrollLeft = dragState.current.startScrollLeft - delta;
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  if (images.length === 0) return null;

  return (
    <div className="relative w-full">
      <div
        ref={scrollerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] cursor-grab select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            data-index={index}
            className="relative aspect-[4/3] w-full flex-shrink-0 snap-start"
          >
            <Image
              src={image.url}
              alt=""
              fill
              draggable={false}
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
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm transition-colors hover:bg-white dark:bg-black/60 dark:hover:bg-black/80"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.min(activeIndex + 1, images.length - 1))}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm transition-colors hover:bg-white dark:bg-black/60 dark:hover:bg-black/80"
          >
            →
          </button>

          <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {activeIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
