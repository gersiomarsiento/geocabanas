"use client";

// app/admin/traducciones/page.tsx

import { useCallback, useEffect, useState } from "react";
import { CollapsibleSection } from "../propiedades/AdminUI";
import TranslationsSiteCard from "./TranslationsSiteCard";
import TranslationsFaqsCard from "./TranslationsFaqsCard";
import TranslationsReviewsCard from "./TranslationsReviewsCard";
import type { LocalizedText } from "@/lib/i18n/getLocalized";
import type { FaqTranslations } from "@/types/faqs";
import type { ReviewTranslations } from "@/types/reviews";

export type EditableLocale = "en" | "pt";

interface SiteTranslations {
  heroTitle: LocalizedText;
  heroSubtitle: LocalizedText;
  heroButtonText: LocalizedText;
  aboutTitle: LocalizedText;
  aboutText: LocalizedText;
  emailSubject: LocalizedText;
  emailIntro: LocalizedText;
}

interface TranslationsResponse {
  site: SiteTranslations;
  faqs: FaqTranslations[];
  reviews: ReviewTranslations[];
}

type SectionId = "site" | "faqs" | "reviews";

const LOCALE_LABELS: Record<EditableLocale, string> = {
  en: "English",
  pt: "Português",
};

export default function TraduccionesPage() {
  const [locale, setLocale] = useState<EditableLocale>("en");
  const [data, setData] = useState<TranslationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<SectionId | null>("site");

  const load = useCallback(() => {
    fetch("/api/admin/translations")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las traducciones");
        return res.json() as Promise<TranslationsResponse>;
      })
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Error desconocido"),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleToggle(section: SectionId) {
    setOpenSection((current) => (current === section ? null : section));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Traducciones</h1>

        <div className="inline-flex rounded-md border border-zinc-300 p-1">
          {(Object.keys(LOCALE_LABELS) as EditableLocale[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                locale === l
                  ? "bg-foreground text-background"
                  : "text-zinc-500 hover:text-foreground"
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        El contenido en español se edita desde las otras pestañas. Acá se
        completan las traducciones al idioma seleccionado arriba.
      </p>

      {error && (
        <p className="mb-4 text-sm font-medium text-red-600">{error}</p>
      )}

      {!data ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <div className="space-y-4">
          <CollapsibleSection
            title="Identidad y sitio"
            open={openSection === "site"}
            onToggle={() => handleToggle("site")}
          >
            <TranslationsSiteCard
              locale={locale}
              data={data.site}
              onSaved={load}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Preguntas frecuentes"
            open={openSection === "faqs"}
            onToggle={() => handleToggle("faqs")}
          >
            <TranslationsFaqsCard
              locale={locale}
              faqs={data.faqs}
              onSaved={load}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Reseñas"
            open={openSection === "reviews"}
            onToggle={() => handleToggle("reviews")}
          >
            <TranslationsReviewsCard
              locale={locale}
              reviews={data.reviews}
              onSaved={load}
            />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}
