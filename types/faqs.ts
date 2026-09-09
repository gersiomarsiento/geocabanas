// types/faqs.ts
//
// Shared types for the FAQ feature. Import these from both the API routes
// and the admin components so the shapes never drift apart.

import type { LocalizedText } from "@/lib/i18n/getLocalized";

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type FaqCreate = {
  question: string;
  answer: string;
};

type LocalizedFieldUpdate = Partial<Record<"es" | "en" | "pt", string>>;

export type FaqUpdate = {
  question?: LocalizedFieldUpdate;
  answer?: LocalizedFieldUpdate;
  sortOrder?: number;
};

// Raw multi-locale shape, for admin surfaces (e.g. the Traducciones tab)
// that need to read/write all three languages at once instead of a single
// resolved string.
export type FaqTranslations = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  sortOrder: number;
};
