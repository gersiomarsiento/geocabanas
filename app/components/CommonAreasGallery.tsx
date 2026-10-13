"use client";

import { useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/free-mode";

export type CommonArea = { id: string; url: string };

/**
 *  - "polaroid": small polaroid-style stacked cards
 *  - "cards":    big, clean stacked cards
 *  - "grid":     free-sliding mosaic; each slide is a mini bento grid
 */
export type GalleryVariant = "polaroid" | "cards" | "grid";

/**
 * Splits `n` images into clusters of 3. Only the last cluster can be smaller,
 * and it stretches to fill the whole slide:
 *   1 left → one image filling the entire slide
 *   2 left → two wide images stacked
 * Examples: 4 → [3,1] · 5 → [3,2] · 6 → [3,3] · 7 → [3,3,1]
 */
function planClusterSizes(n: number): number[] {
  if (n <= 0) return [];
  const sizes: number[] = Array(Math.floor(n / 3)).fill(3);
  if (n % 3 !== 0) sizes.push(n % 3);
  return sizes;
}

function buildClusters(items: CommonArea[]) {
  const clusters: { item: CommonArea; idx: number }[][] = [];
  let cursor = 0;
  for (const size of planClusterSizes(items.length)) {
    clusters.push(
      items.slice(cursor, cursor + size).map((item, k) => ({
        item,
        idx: cursor + k,
      })),
    );
    cursor += size;
  }
  return clusters;
}

/*
 * Spacing: the gap between images inside a cluster (gap-2 / md:gap-3)
 * and the gap between slides (spaceBetween) share the same values,
 * so the mosaic reads as one continuous grid.
 *   mobile: 8px  ·  md+: 12px
 */
const GRID_GAP_MOBILE = 8;
const GRID_GAP_DESKTOP = 12;

export default function CommonAreasGallery({
  items,
  variant,
}: {
  items: CommonArea[];
  variant: GalleryVariant;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  if (variant === "polaroid") {
    return (
      <>
        <Swiper
          effect="cards"
          grabCursor
          modules={[EffectCards]}
          initialSlide={Math.floor((items.length - 1) / 2)}
          cardsEffect={{
            perSlideOffset: 40,
            perSlideRotate: 3,
            slideShadows: false,
          }}
          className="shared-spaces-swiper mx-auto w-64 md:w-100"
        >
          {items.map(({ id, url }) => (
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
      </>
    );
  }

  if (variant === "cards") {
    return (
      <Swiper
        effect="cards"
        grabCursor
        modules={[EffectCards]}
        cardsEffect={{
          rotate: false,
          perSlideOffset: 10,
          slideShadows: true,
        }}
        className="mx-auto aspect-[4/5] w-[80%] max-w-sm md:aspect-[16/10] md:w-full md:max-w-3xl"
      >
        {items.map(({ id, url }, i) => (
          <SwiperSlide key={id} className="rounded-2xl bg-zinc-200 shadow-lg">
            <Image
              src={url}
              alt={`Espacios comunes ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 768px, 80vw"
              className="object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }

  // "grid"
  const clusters = buildClusters(items);

  return (
    <>
      {/*
        Full-bleed: this wrapper is as wide as the screen, whatever the
        section's padding / max-width. The Swiper's own padding then pushes
        the first slide back in line with the site's content, and slides can
        scroll into that padding area up to the screen edges.
        (88.5rem = max-w-354 of the section container; 0.75rem / 1.5rem =
        the section's px-3 / md:px-6.) Requires overflow-x-clip on the section.
      */}
      <div className="ml-[calc(50%_-_50vw)] w-screen">
        <Swiper
          modules={[FreeMode]}
          freeMode
          grabCursor
          slidesPerView={1.05}
          spaceBetween={GRID_GAP_MOBILE}
          className="!px-[max(0.75rem,calc((100%_-_88.5rem)/2))] md:!px-[max(1.5rem,calc((100%_-_88.5rem)/2))]"
          onProgress={(_, p) => {
            if (barRef.current) {
              barRef.current.style.transform = `scaleX(${Math.max(p, 0.1)})`;
            }
          }}
          breakpoints={{
            768: {
              slidesPerView: 2.2,
              spaceBetween: GRID_GAP_DESKTOP,
            },
          }}
        >
          {clusters.map((group, c) => {
            const size = group.length;
            // alternate rhythm: wide image on top, then wide image at the bottom
            const flip = size === 3 && c % 2 === 1;
            const ordered = flip ? [group[1], group[2], group[0]] : group;
            const rows =
              size === 3
                ? flip
                  ? "grid-rows-[2fr_3fr]"
                  : "grid-rows-[3fr_2fr]"
                : size === 2
                  ? "grid-rows-2"
                  : "grid-rows-1";

            return (
              <SwiperSlide key={group[0].item.id}>
                {/* every cluster has the same fixed ratio, so no slide ever has empty space */}
                <div
                  className={`grid aspect-[4/5] grid-cols-2 gap-2 md:aspect-square md:gap-3 ${rows}`}
                >
                  {ordered.map(({ item, idx }) => {
                    const wide = size < 3 || idx === group[0].idx;
                    return (
                      <div
                        key={item.id}
                        className={`relative min-h-0 overflow-hidden rounded-xl bg-zinc-200 shadow-md ${
                          wide ? "col-span-2" : ""
                        }`}
                      >
                        <Image
                          src={item.url}
                          alt={`Espacios comunes ${idx + 1}`}
                          fill
                          sizes={
                            wide
                              ? "(min-width: 768px) 45vw, 90vw"
                              : "(min-width: 768px) 22vw, 45vw"
                          }
                          className="object-cover"
                        />
                      </div>
                    );
                  })}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {clusters.length > 1 && (
        <div
          aria-hidden="true"
          className="mx-auto mt-5 h-0.5 w-24 overflow-hidden rounded-full bg-white/20"
        >
          <div
            ref={barRef}
            className="h-full origin-left rounded-full bg-white"
            style={{ transform: "scaleX(0.1)" }}
          />
        </div>
      )}
    </>
  );
}