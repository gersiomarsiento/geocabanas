import type { LocalizedText } from "@/lib/i18n/getLocalized";

export type ReviewSource = "Google" | "Booking" | "Airbnb";

export interface Review {
  id: string;
  author: string;
  rating: number;
  source: ReviewSource;
  url: string;
  text: string;
  sortOrder: number;
}

export type ReviewCreate = {
  author: string;
  rating: number;
  source: string;
  url: string;
  text: string;
};

type LocalizedFieldUpdate = Partial<Record<"es" | "en" | "pt", string>>;

export type ReviewUpdate = {
  author?: string;
  rating?: number;
  source?: string;
  url?: string;
  text?: LocalizedFieldUpdate;
  sortOrder?: number;
};

// Raw multi-locale shape, for admin surfaces (e.g. the Traducciones tab)
// that need to read/write all three languages at once instead of a single
// resolved string. Mirrors FaqTranslations in types/faqs.ts.
export type ReviewTranslations = {
  id: string;
  author: string;
  rating: number;
  source: ReviewSource;
  url: string;
  text: LocalizedText;
  sortOrder: number;
};
