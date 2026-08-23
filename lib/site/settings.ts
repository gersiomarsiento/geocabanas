import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LocalizedText } from "@/lib/i18n/getLocalized";

export interface ContactSettings {
  contactWhatsapp: string | null;
  contactEmail: string | null;
  contactInstagram: string | null;

  mapLatitude: number | null;
  mapLongitude: number | null;
  mapAddress: string | null;

  heroTitle: LocalizedText | null;
  heroSubtitle: LocalizedText | null;
  heroButtonText: LocalizedText | null;
  heroButtonHref: string | null; 

  emailSubject: string | null;
  emailIntro: string | null;

  exchangeRateUyu: number;
  exchangeRateBrl: number;

  aboutTitle: LocalizedText | null;
  aboutText: LocalizedText | null;
}

export async function getContactSettings(): Promise<ContactSettings> {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select(
      `
      contact_whatsapp,
      contact_email,
      contact_instagram,
      map_latitude,
      map_longitude,
      map_address,
      hero_title,
      hero_subtitle,
      hero_button_text,
      hero_button_href,
      email_subject,
      email_intro,
      exchange_rate_uyu,
      exchange_rate_brl,
      about_title,
      about_text
      `,
    )
    .eq("id", "singleton")
    .single();

  if (error || !data) {
    console.error("Failed to load site settings:", error);

    return {
      contactWhatsapp: null,
      contactEmail: null,
      contactInstagram: null,

      mapLatitude: null,
      mapLongitude: null,
      mapAddress: null,

      heroTitle: null,
      heroSubtitle: null,
      heroButtonText: null,
      heroButtonHref: null,

      emailSubject: null,
      emailIntro: null,

      exchangeRateUyu: 42.5,
      exchangeRateBrl: 5.4,
      aboutTitle: null,
      aboutText: null,
    };
  }

  return {
    contactWhatsapp: data.contact_whatsapp,
    contactEmail: data.contact_email,
    contactInstagram: data.contact_instagram,

    mapLatitude: data.map_latitude,
    mapLongitude: data.map_longitude,
    mapAddress: data.map_address,

    heroTitle: data.hero_title,
    heroSubtitle: data.hero_subtitle,
    heroButtonText: data.hero_button_text,
    heroButtonHref: data.hero_button_href,

    emailSubject: data.email_subject,
    emailIntro: data.email_intro,

    exchangeRateUyu: Number(data.exchange_rate_uyu),
    exchangeRateBrl: Number(data.exchange_rate_brl),
    
    aboutTitle: data.about_title,
    aboutText: data.about_text,
  };
}
