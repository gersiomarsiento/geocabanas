"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";

interface PublicReview {
  id: string;
  author: string;
  rating: number;
  source: "Google" | "Booking" | "Airbnb";
  url: string;
  text: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-accent" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < rating ? "" : "opacity-30"}>
          ★
        </span>
      ))}
    </div>
  );
}

function SourceBadge({ source }: { source: PublicReview["source"] }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-medium">
      <Image
        src={`/images/${source}.png`}
        alt={source}
        width={60}
        height={24}
        className="w-auto"
      />
    </span>
  );
}

export default function ReviewsSection() {
  const t = useTranslations("Reviews");
  const locale = useLocale();
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch(`/api/reviews?locale=${locale}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudieron cargar las reseñas");
        }
        return res.json() as Promise<PublicReview[]>;
      })
      .then((data) => {
        setReviews(data);
        if (data && data.length > 0) {
          // Empezamos exactamente en el primer elemento del bloque del medio
          setCurrentIndex(data.length);
        }
      })
      .catch(() => setReviews([]));
  }, [locale]);

  // Efecto para pasar automáticamente cada 5 segundos
  useEffect(() => {
    if (!reviews || reviews.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }, 8000);

    return () => clearInterval(interval);
  }, [reviews]);

  // Lógica de reseteo invisible para el loop infinito continuo
  useEffect(() => {
    if (!reviews || reviews.length === 0) return;
    const n = reviews.length;

    // Si llegamos al tercer bloque, teletransportamos de vuelta al bloque del medio de forma imperceptible
    if (currentIndex >= n * 2) {
      const timer = setTimeout(() => {
        setIsTransitionEnabled(false); // Apagamos la transición para que el salto sea instantáneo
        setCurrentIndex((prev) => prev - n);

        // Reactivamos la transición en el siguiente ciclo de render
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitionEnabled(true);
          });
        });
      }, 700); // Debe coincidir con la duración de la animación (duration-700)

      return () => clearTimeout(timer);
    }
  }, [currentIndex, reviews]);

  if (reviews && reviews.length === 0) return null;

  // Triplicamos el array: [Bloque Izq (Últimas), Bloque Centro (Original), Bloque Der (Primeras)]
  const extendedReviews = reviews ? [...reviews, ...reviews, ...reviews] : [];

  return (
    <section
      aria-labelledby="reviews-title"
      className="w-full py-10 md:py-16 bg-linear-180 from-primary to-secondary-50 overflow-hidden"
    >
      <div className="mx-auto max-w-354">
        <div className="mb-6 px-3 md:px-6 text-center md:mb-10">
          <h2
            id="reviews-title"
            className="text-xl font-semibold text-background md:text-2xl"
          >
            {t("titulo")}
          </h2>
          <p className="mt-2 text-sm text-background">{t("subtitulo")}</p>
        </div>

        {!reviews ? (
          <p className="text-center text-sm text-background">{t("cargando")}</p>
        ) : (
          /* Contenedor con la máscara de desvanecimiento a los lados que ya tenías */
          <div className="relative overflow-hidden xs:mask-[linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] [xs:-webkit-mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] py-4 px-4">
            {/* Pista (Track) que se desliza suavemente de forma horizontal */}
            <div
              className={`flex items-center gap-6 ${
                isTransitionEnabled
                  ? "transition-transform duration-700 ease-out"
                  : ""
              }`}
              style={{
                // Calculamos cuánto se mueve la pista para que la card actual quede centrada
                // Nota: Usamos un ancho fijo de card (ej. 400px / w-100) + el gap (24px / gap-6)
                transform: `translateX(calc(50% - var(--card-half) - ${currentIndex} * (var(--card-width) + 24px)))`,
                // transform: `translateX(calc(50% - ${ width < 768 ? "150px":"200px" } - ${currentIndex * (width < 768 ? 300 + 18 : 400 + 24)}px))`,
              }}
            >
              {extendedReviews.map((review, index) => {
                const isCenter = index === currentIndex;

                return (
                  <article
                    key={`${review.id}-${index}`}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex flex-col justify-between min-h-60 shrink-0 w-70 md:w-100 rounded-2xl border bg-primary-50 p-6 shadow-md cursor-pointer transition-all duration-700 ${
                      isCenter
                        ? "scale-105 border-0 shadow-xl opacity-100 z-10"
                        : "scale-85 border-0 opacity-40 blur-[0.5px] hover:opacity-70"
                    }`}
                  >
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Stars rating={review.rating} />
                        <SourceBadge source={review.source} />
                      </div>
                      <blockquote className="mt-4 flex-1 text-sm md:text-base leading-6 text-zinc-700 line-clamp-4">
                        “{review.text}”
                      </blockquote>
                      <p className="mt-5 text-sm font-semibold text-foreground absolute bottom-5 right-10">
                        — {review.author}
                      </p>
                    </a>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* Definimos las métricas exactas por media query para que el cálculo del translate no falle */}
      <style jsx>{`
        div {
          --card-width: 280px;
          --card-half: 140px;
        }
        @media (min-width: 768px) {
          div {
            --card-width: 400px;
            --card-half: 200px;
          }
        }
      `}</style>
    </section>
  );
}
