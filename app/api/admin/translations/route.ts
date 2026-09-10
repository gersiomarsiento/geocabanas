// app/api/admin/translations/route.ts
//
// GET -> raw (unresolved) localized content for the Traducciones admin tab.
// Unlike the public-facing routes, this does NOT call getLocalized() to
// collapse each field down to one language — it returns the full
// {es, en, pt} object so the admin can see/edit all three at once.
//
// Saving is done through the existing per-resource PATCH routes
// (/api/admin/site-settings, /api/admin/faqs/[id], /api/admin/reviews/[id]),
// each of which already accepts a partial {es?, en?, pt?} update per field.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LocalizedText } from "@/lib/i18n/getLocalized";
import type { FaqTranslations } from "@/types/faqs";
import type { ReviewTranslations } from "@/types/reviews";

const EMPTY_LOCALIZED: LocalizedText = { es: "" };

interface SiteTranslations {
  heroTitle: LocalizedText;
  heroSubtitle: LocalizedText;
  heroButtonText: LocalizedText;
  aboutTitle: LocalizedText;
  aboutText: LocalizedText;
  emailSubject: LocalizedText;
  emailIntro: LocalizedText;
}

export async function GET() {
  const [siteResult, faqsResult, reviewsResult] = await Promise.all([
    supabaseAdmin
      .from("site_settings")
      .select(
        "hero_title, hero_subtitle, hero_button_text, about_title, about_text, email_subject, email_intro",
      )
      .eq("id", "singleton")
      .single(),
    supabaseAdmin
      .from("faqs")
      .select("id, question, answer, sort_order")
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("reviews")
      .select("id, author, rating, source, url, text, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (siteResult.error || faqsResult.error || reviewsResult.error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las traducciones" },
      { status: 500 },
    );
  }

  const siteRow = siteResult.data;
  const site: SiteTranslations = {
    heroTitle: siteRow?.hero_title ?? EMPTY_LOCALIZED,
    heroSubtitle: siteRow?.hero_subtitle ?? EMPTY_LOCALIZED,
    heroButtonText: siteRow?.hero_button_text ?? EMPTY_LOCALIZED,
    aboutTitle: siteRow?.about_title ?? EMPTY_LOCALIZED,
    aboutText: siteRow?.about_text ?? EMPTY_LOCALIZED,
    emailSubject: siteRow?.email_subject ?? EMPTY_LOCALIZED,
    emailIntro: siteRow?.email_intro ?? EMPTY_LOCALIZED,
  };

  const faqs: FaqTranslations[] = faqsResult.data.map((faq) => ({
    id: faq.id,
    question: faq.question ?? EMPTY_LOCALIZED,
    answer: faq.answer ?? EMPTY_LOCALIZED,
    sortOrder: faq.sort_order,
  }));

  const reviews: ReviewTranslations[] = reviewsResult.data.map((review) => ({
    id: review.id,
    author: review.author,
    rating: review.rating,
    source: review.source,
    url: review.url,
    text: review.text ?? EMPTY_LOCALIZED,
    sortOrder: review.sort_order,
  }));

  return NextResponse.json({ site, faqs, reviews });
}
