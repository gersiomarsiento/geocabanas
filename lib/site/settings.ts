import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LocalizedText } from "@/lib/i18n/getLocalized";
import type { FeatureItem, StayInfoItem } from "@/lib/site/features";

export type BookingMode = "reservation" | "request";
export interface ContactSettings {
  businessName: string | null;
  businessAddress: string | null;

  contactWhatsapp: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactInstagram: string | null;
  contactFacebook: string | null;

  mapLatitude: number | null;
  mapLongitude: number | null;
  mapAddress: string | null;

  heroTitle: LocalizedText | null;
  heroSubtitle: LocalizedText | null;
  heroButtonText: LocalizedText | null;
  heroButtonHref: string | null;

  hero2Title: LocalizedText | null;
  hero2Subtitle: LocalizedText | null;
  hero2ButtonText: LocalizedText | null;
  hero2ButtonHref: string | null;

  hero3Title: LocalizedText | null;
  hero3Subtitle: LocalizedText | null;
  hero3ButtonText: LocalizedText | null;
  hero3ButtonHref: string | null;

  emailSubject: LocalizedText | null;
  emailIntro: LocalizedText | null;

  exchangeRateUyu: number;
  exchangeRateBrl: number;

  aboutTitle: LocalizedText | null;
  aboutText: LocalizedText | null;

  bookingMode: BookingMode;

  featuresTitle: LocalizedText | null;
  features: FeatureItem[] | null;
  stayInfo: StayInfoItem[] | null;
}

export async function getContactSettings(): Promise<ContactSettings> {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select(
      `
      business_name,
      business_address,
      contact_whatsapp,
      contact_phone,
      contact_email,
      contact_instagram,
      contact_facebook,
      map_latitude,
      map_longitude,
      map_address,
      hero_title,
      hero_subtitle,
      hero_button_text,
      hero_button_href,
      hero2_title,
      hero2_subtitle,
      hero2_button_text,
      hero2_button_href,
      hero3_title,
      hero3_subtitle,
      hero3_button_text,
      hero3_button_href,
      email_subject,
      email_intro,
      exchange_rate_uyu,
      exchange_rate_brl,
      about_title,
      about_text,
      booking_mode,
      features_title,
      features,
      stay_info
      `,
    )
    .eq("id", "singleton")
    .single();

  if (error || !data) {
    console.error("Failed to load site settings:", error);

    return {
      businessName: null,
      businessAddress: null,

      contactWhatsapp: null,
      contactPhone: null,
      contactEmail: null,
      contactInstagram: null,
      contactFacebook: null,

      mapLatitude: null,
      mapLongitude: null,
      mapAddress: null,

      heroTitle: null,
      heroSubtitle: null,
      heroButtonText: null,
      heroButtonHref: null,

      hero2Title: null,
      hero2Subtitle: null,
      hero2ButtonText: null,
      hero2ButtonHref: null,

      hero3Title: null,
      hero3Subtitle: null,
      hero3ButtonText: null,
      hero3ButtonHref: null,

      emailSubject: null,
      emailIntro: null,

      exchangeRateUyu: 42.5,
      exchangeRateBrl: 5.4,
      aboutTitle: null,
      aboutText: null,
      bookingMode: "reservation",
      featuresTitle: null,
      features: null,
      stayInfo: null,
    };
  }

  return {
    businessName: data.business_name,
    businessAddress: data.business_address,

    contactWhatsapp: data.contact_whatsapp,
    contactPhone: data.contact_phone,
    contactEmail: data.contact_email,
    contactInstagram: data.contact_instagram,
    contactFacebook: data.contact_facebook,

    mapLatitude: data.map_latitude,
    mapLongitude: data.map_longitude,
    mapAddress: data.map_address,

    heroTitle: data.hero_title,
    heroSubtitle: data.hero_subtitle,
    heroButtonText: data.hero_button_text,
    heroButtonHref: data.hero_button_href,

    hero2Title: data.hero2_title,
    hero2Subtitle: data.hero2_subtitle,
    hero2ButtonText: data.hero2_button_text,
    hero2ButtonHref: data.hero2_button_href,

    hero3Title: data.hero3_title,
    hero3Subtitle: data.hero3_subtitle,
    hero3ButtonText: data.hero3_button_text,
    hero3ButtonHref: data.hero3_button_href,

    emailSubject: data.email_subject,
    emailIntro: data.email_intro,

    exchangeRateUyu: Number(data.exchange_rate_uyu),
    exchangeRateBrl: Number(data.exchange_rate_brl),

    aboutTitle: data.about_title,
    aboutText: data.about_text,
    bookingMode: (data.booking_mode as BookingMode) ?? "reservation",

    featuresTitle: data.features_title,
    features: (data.features ?? null) as FeatureItem[] | null,
    stayInfo: (data.stay_info ?? null) as StayInfoItem[] | null,
  };
}
