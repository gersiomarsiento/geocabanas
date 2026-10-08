// app/api/admin/site-settings/route.ts
//
// PATCH -> updates contact/map/localized-content fields on the singleton site_settings row.

// TODO: gate this route behind your admin auth/session check before ship.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LocalizedText } from "@/lib/i18n/getLocalized";

type LocalizedFieldUpdate = Partial<Record<"es" | "en" | "pt", string>>;

interface SiteSettingsUpdate {
  businessName?: string;
  businessAddress?: string;
  contactWhatsapp?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactInstagram?: string;
  contactFacebook?: string;
  mapLatitude?: number;
  mapLongitude?: number;
  mapAddress?: string;
  heroTitle?: LocalizedFieldUpdate;
  heroSubtitle?: LocalizedFieldUpdate;
  heroButtonText?: LocalizedFieldUpdate;
  heroButtonHref?: string;
  hero2Title?: LocalizedFieldUpdate;
  hero2Subtitle?: LocalizedFieldUpdate;
  hero2ButtonText?: LocalizedFieldUpdate;
  hero2ButtonHref?: string;
  hero3Title?: LocalizedFieldUpdate;
  hero3Subtitle?: LocalizedFieldUpdate;
  hero3ButtonText?: LocalizedFieldUpdate;
  hero3ButtonHref?: string;
  aboutTitle?: LocalizedFieldUpdate;
  aboutText?: LocalizedFieldUpdate;
  emailSubject?: LocalizedFieldUpdate;
  emailIntro?: LocalizedFieldUpdate;
  exchangeRateUyu?: number;
  exchangeRateBrl?: number;
  featuresTitle?: LocalizedFieldUpdate;
  features?: { icon: string; label: LocalizedFieldUpdate }[];
  stayInfo?: { value: string; label: LocalizedFieldUpdate }[];
}

const LOCALIZED_FIELDS = [
  ["heroTitle", "hero_title"],
  ["heroSubtitle", "hero_subtitle"],
  ["heroButtonText", "hero_button_text"],
  ["hero2Title", "hero2_title"],
  ["hero2Subtitle", "hero2_subtitle"],
  ["hero2ButtonText", "hero2_button_text"],
  ["hero3Title", "hero3_title"],
  ["hero3Subtitle", "hero3_subtitle"],
  ["hero3ButtonText", "hero3_button_text"],
  ["aboutTitle", "about_title"],
  ["aboutText", "about_text"],
  ["emailSubject", "email_subject"],
  ["emailIntro", "email_intro"],
  ["featuresTitle", "features_title"],
] as const;

const PLAIN_TEXT_FIELDS = [
  ["heroButtonHref", "hero_button_href"],
  ["hero2ButtonHref", "hero2_button_href"],
  ["hero3ButtonHref", "hero3_button_href"],
] as const;

const MERGE_SELECT = [
  ...LOCALIZED_FIELDS.map(([, column]) => column),
  "features",
  "stay_info",
].join(", ");

type StoredFeature = { icon: string; label: LocalizedText };
type StoredStayInfo = { value: string; label: LocalizedText };
type CurrentSettings = Partial<
  Record<(typeof LOCALIZED_FIELDS)[number][1], LocalizedText | null>
> & {
  features?: StoredFeature[] | null;
  stay_info?: StoredStayInfo[] | null;
};

function pickLocales(value: LocalizedFieldUpdate): LocalizedFieldUpdate {
  const result: LocalizedFieldUpdate = {};
  for (const locale of ["es", "en", "pt"] as const) {
    if (value[locale] != null) result[locale] = value[locale];
  }
  return result;
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as SiteSettingsUpdate;

  const needsLocalizedMerge =
    LOCALIZED_FIELDS.some(([key]) => body[key] != null) ||
    body.features != null ||
    body.stayInfo != null;

  let currentLocalized: CurrentSettings = {};
  if (needsLocalizedMerge) {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select(MERGE_SELECT)
      .eq("id", "singleton")
      .single();
    currentLocalized = (data ?? {}) as CurrentSettings;
  }

  const update: Record<string, unknown> = {};
  if (body.businessName != null) update.business_name = body.businessName;
  if (body.businessAddress != null)
    update.business_address = body.businessAddress;
  if (body.contactWhatsapp != null)
    update.contact_whatsapp = body.contactWhatsapp;
  if (body.contactPhone != null) update.contact_phone = body.contactPhone;
  if (body.contactEmail != null) update.contact_email = body.contactEmail;
  if (body.contactInstagram != null)
    update.contact_instagram = body.contactInstagram;
  if (body.contactFacebook != null)
    update.contact_facebook = body.contactFacebook;
  if (body.mapLatitude != null) update.map_latitude = body.mapLatitude;
  if (body.mapLongitude != null) update.map_longitude = body.mapLongitude;
  if (body.mapAddress != null) update.map_address = body.mapAddress;

  for (const [bodyKey, column] of LOCALIZED_FIELDS) {
    const value = body[bodyKey];
    if (value == null) continue;
    update[column] = {
      ...(currentLocalized[column] ?? {}),
      ...pickLocales(value),
    };
  }

  for (const [bodyKey, column] of PLAIN_TEXT_FIELDS) {
    const value = body[bodyKey];
    if (value != null) update[column] = value;
  }

  const MAX_FEATURES = 8;
  const MAX_STAY_INFO = 4;

  function cleanLabel(label: LocalizedFieldUpdate | undefined, max: number) {
    const out: LocalizedFieldUpdate = {};
    for (const locale of ["es", "en", "pt"] as const) {
      const v = label?.[locale]?.trim();
      if (v) out[locale] = v.slice(0, max);
    }
    return out;
  }

  if (body.features != null) {
    if (!Array.isArray(body.features)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }
    update.features = body.features
      .filter((f) => typeof f?.icon === "string")
      .map((f) => ({ icon: f.icon, label: cleanLabel(f.label, 60) }))
      .filter((f) => f.label.es) // Spanish is required
      .slice(0, MAX_FEATURES);
  }

  if (body.stayInfo != null) {
    if (!Array.isArray(body.stayInfo)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }
    update.stay_info = body.stayInfo
      .filter((s) => typeof s?.value === "string" && s.value.trim() !== "")
      .map((s) => ({
        value: s.value.trim().slice(0, 12),
        label: cleanLabel(s.label, 30),
      }))
      .filter((s) => s.label.es)
      .slice(0, MAX_STAY_INFO);
  }

  if (body.exchangeRateUyu != null) {
    update.exchange_rate_uyu = body.exchangeRateUyu;
  }
  if (body.exchangeRateBrl != null) {
    update.exchange_rate_brl = body.exchangeRateBrl;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No hay cambios para guardar" },
      { status: 400 },
    );
  }
  if (
    body.exchangeRateUyu != null &&
    (!Number.isFinite(body.exchangeRateUyu) || body.exchangeRateUyu < 0)
  ) {
    return NextResponse.json(
      { error: "La tasa UYU debe ser un número mayor que 0" },
      { status: 400 },
    );
  }
  if (
    body.exchangeRateBrl != null &&
    (!Number.isFinite(body.exchangeRateBrl) || body.exchangeRateBrl < 0)
  ) {
    return NextResponse.json(
      { error: "La tasa BRL debe ser un número mayor que 0" },
      { status: 400 },
    );
  }

  update.updated_at = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({ id: "singleton", ...update }, { onConflict: "id" });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo guardar la configuración" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
