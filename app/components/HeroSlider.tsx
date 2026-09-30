"use client";

import { ReactNode, useState } from "react";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { Autoplay } from "swiper/modules";
import CaretIcon from "./icons/CaretIcon";

import "swiper/css";
import "swiper/css/effect-fade";

function SlideButton({
  direction,
  disabled,
}: {
  direction: "prev" | "next";
  disabled: boolean;
}) {
  const swiper = useSwiper();
  const isNext = direction === "next";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => (isNext ? swiper.slideNext() : swiper.slidePrev())}
      aria-label={isNext ? "Siguiente slide" : "Slide anterior"}
      className={`absolute top-1/2 -translate-y-1/2 z-30 transition ${
        isNext ? "right-2" : "left-2"
      } ${disabled ? "opacity-10 cursor-not-allowed" : ""}`}
    >
      <CaretIcon
        className={`hidden lg:block text-white ${!isNext ? "rotate-180" : ""}`}
      />
    </button>
  );
}

export default function HeroSlider({ slides }: { slides: ReactNode[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(slides.length <= 1);

  return (
    <section className="relative w-full">
      <Swiper
        modules={[Autoplay]}
        grabCursor
        speed={600}
        autoplay={{ delay: 6000, disableOnInteraction: true }}
        onSwiper={(s) => {
          setIsBeginning(s.isBeginning);
          setIsEnd(s.isEnd);
        }}
        onSlideChange={(s) => {
          setActiveIndex(s.activeIndex);
          setIsBeginning(s.isBeginning);
          setIsEnd(s.isEnd);
        }}
        className="w-full"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className="relative flex h-svh w-full items-center justify-center bg-primary">
              {slide}
            </div>
          </SwiperSlide>
        ))}

        <SlideButton direction="prev" disabled={isBeginning} />
        <SlideButton direction="next" disabled={isEnd} />
      </Swiper>

      {/* Pagination */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === activeIndex ? "w-4 bg-secondary" : "w-2 bg-white"
            }`}
          />
        ))}
      </div>
    </section>
  );
}