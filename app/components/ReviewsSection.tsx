import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
// import Image from "../../public";

type Review = {
  id: number;
  author: string;
  rating: number;
  source: "Google" | "Booking" | "Airbnb";
  text: {
    es: string;
    en: string;
    pt: string;
  };
};

const REVIEWS: Review[] = [
  {
    id: 1,
    author: "María",
    rating: 5,
    source: "Google",
    text: {
      es: "Un lugar hermoso, tranquilo y muy cerca de la playa. La cabaña estaba impecable y nos sentimos como en casa.",
      en: "A beautiful, peaceful place very close to the beach. The cabin was spotless and we felt right at home.",
      pt: "Um lugar lindo, tranquilo e muito perto da praia. A cabana estava impecável e nos sentimos em casa.",
    },
  },
  {
    id: 2,
    author: "Juan",
    rating: 5,
    source: "Booking",
    text: {
      es: "Excelente ubicación y mucha tranquilidad. Todo estaba muy cuidado y la atención fue excelente.",
      en: "Excellent location and very peaceful. Everything was very well maintained and the service was excellent.",
      pt: "Excelente localização e muita tranquilidade. Tudo muito bem cuidado e o atendimento foi excelente.",
    },
  },
  {
    id: 3,
    author: "Sofía",
    rating: 5,
    source: "Airbnb",
    text: {
      es: "Pasamos unos días increíbles. La cabaña es cómoda, linda y tiene todo lo necesario para disfrutar.",
      en: "We had an amazing few days. The cabin is comfortable, beautiful, and has everything you need to enjoy your stay.",
      pt: "Passamos dias incríveis. A cabana é confortável, bonita e tem tudo o que é necessário para aproveitar a estadia.",
    },
  },
  {
    id: 4,
    author: "Lucas",
    rating: 5,
    source: "Airbnb",
    text: {
      es: "Un lugar tranquilo y acogedor. Disfrutamos mucho nuestra estadía y sin dudas volveríamos.",
      en: "A peaceful and welcoming place. We really enjoyed our stay and would definitely come back.",
      pt: "Um lugar tranquilo e acolhedor. Aproveitamos muito a estadia e com certeza voltaríamos.",
    },
  },
  {
    id: 5,
    author: "Martín",
    rating: 5,
    source: "Google",
    text: {
      es: "Un lugar hermoso para descansar y desconectarse. Todo estuvo impecable y la atención fue excelente.",
      en: "A beautiful place to relax and disconnect. Everything was spotless and the hospitality was excellent.",
      pt: "Um lugar lindo para descansar e se desconectar. Tudo estava impecável e a hospitalidade foi excelente.",
    },
  },
  {
    id: 6,
    author: "Camila",
    rating: 5,
    source: "Booking",
    text: {
      es: "La ubicación es excelente, muy cerca de la playa. La cabaña estaba limpia, cómoda y muy bien equipada.",
      en: "The location is excellent, very close to the beach. The cabin was clean, comfortable, and very well equipped.",
      pt: "A localização é excelente, muito perto da praia. A cabana estava limpa, confortável e muito bem equipada.",
    },
  },
];

const REVIEW_URLS = {
  Google:
    "https://www.google.com/travel/search?q=google%20maps%20geo%20punta%20del%20diablo&g2lb=4965990%2C72471280%2C72560029%2C72573224%2C72647020%2C72686036%2C72803964%2C72880339%2C72882230%2C72887409%2C73064764%2C121529350%2C121608706%2C121738283%2C121762713%2C121921500&hl=en-UY&gl=uy&cs=1&ssta=1&ts=CAEaRwopEicyJTB4OTU3MzJkNzBmNjNkYTJiNzoweGJjNjViMzUxNTkxYmY1MDISGhIUCgcI6g8QCRgHEgcI6g8QCRgIGAEyAhAA&qs=CAEyFENnc0lndXJ2eUpYcTdMSzhBUkFCOAJCCQkC9RtZUbNlvEIJCQL1G1lRs2W8&ap=ugEHcmV2aWV3cw&ictx=111&ved=0CAAQ5JsGahcKEwiIiNypgL-WAxUAAAAAHQAAAAAQAw",
  Booking:
    "https://www.booking.com/hotel/uy/geo-punta-del-diablo-apartamento-2.es.html?label=gen173nr-10CAso7QFCImdlby1wdW50YS1kZWwtZGlhYmxvLWFwYXJ0YW1lbnRvLTJIM1gEaO0BiAEBmAEzuAEXyAEM2AED6AEB-AEBiAIBqAIBuAL56rvUBsACAdICJDUwNzI4YmRjLWJmNjEtNGUwZS05NzRkLWYxYjQyMTU2ZGVjYdgCAeACAQ&sid=eef9a494f8a0517a1b1d224618efaf2f&dist=0&keep_landing=1&sb_price_type=total&type=total&#tab-reviews",
  Airbnb:
    "https://www.airbnb.com/rooms/22339840?source_impression_id=p3_1787771665_P3F5IL0NS9SVlTE0",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-accent" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index}>★</span>
      ))}
    </div>
  );
}

function SourceBadge({ source }: { source: Review["source"] }) {
  return (
    <span className="rounded-full  px-2.5 py-1 text-xs font-medium">
      <Image
        src={`/images/${source}.png`}
        alt="Geocabañas"
        width={60}
        height={24}
        className="w-auto "
      />
    </span>
  );
}

export default function ReviewsSection() {
  const t = useTranslations("Reviews");
  const locale = useLocale() as "es" | "en" | "pt";

  return (
    <section
      aria-labelledby="reviews-title"
      className="w-full py-10 md:py-16 bg-linear-180 from-primary to-secondary-50"
    >
      <div className="mx-auto max-w-360">
        <div className="mb-6 px-3 md:px-6 text-center md:mb-10">
          <h2
            id="reviews-title"
            className="text-xl font-semibold text-background md:text-2xl"
          >
            {t("titulo")}
          </h2>

          <p className="mt-2 text-sm text-background">{t("subtitulo")}</p>
        </div>

        {/* Contenedor con la máscara de desvanecimiento hacia los bordes */}
        <div className="relative overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="reviews-track flex w-max gap-4">
            {[...REVIEWS, ...REVIEWS].map((review, index) => (
              <article
                key={`${review.id}-${index}`}
                className="flex flex-col max-w-120 rounded-xl border border-zinc-200 bg-primary-50 p-5 shadow-sm transition hover:scale-[1.01]"
              >
                <a href={REVIEW_URLS[review.source]} target="_blank">
                  <div className="flex items-center justify-between gap-3">
                    <Stars rating={review.rating} />
                    <SourceBadge source={review.source} />
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-6 text-zinc-700">
                    “{review.text[locale]}”
                  </blockquote>
                  <p className="mt-5 text-sm font-semibold text-foreground">
                    {review.author}
                  </p>
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
