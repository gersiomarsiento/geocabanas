// app/api/admin/site-settings/route.ts
//
// PATCH -> updates contact/map fields on the singleton site_settings row.

// TODO: gate this route behind your admin auth/session check before ship.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LocalizedText } from "@/lib/i18n/getLocalized";

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
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  heroButtonHref?: string;
  emailSubject?: string;
  emailIntro?: string;
  exchangeRateUyu?: number;
  exchangeRateBrl?: number;
}

const LOCALIZED_HERO_FIELDS = [
  ["heroTitle", "hero_title"],
  ["heroSubtitle", "hero_subtitle"],
  ["heroButtonText", "hero_button_text"],
] as const;

export async function PATCH(request: Request) {
  const body = (await request.json()) as SiteSettingsUpdate;

  const needsHeroMerge = LOCALIZED_HERO_FIELDS.some(
    ([key]) => body[key] != null,
  );

  let currentHero: Record<string, LocalizedText | null> = {};
  if (needsHeroMerge) {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("hero_title, hero_subtitle, hero_button_text")
      .eq("id", "singleton")
      .single();
    currentHero = data ?? {};
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

  for (const [bodyKey, column] of LOCALIZED_HERO_FIELDS) {
    const value = body[bodyKey];
    if (value == null) continue;
    update[column] = { ...(currentHero[column] ?? {}), es: value };
  }

  if (body.heroButtonHref != null)
    update.hero_button_href = body.heroButtonHref;
  if (body.emailSubject != null) update.email_subject = body.emailSubject;
  if (body.emailIntro != null) update.email_intro = body.emailIntro;
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
    .update(update)
    .eq("id", "singleton");

  if (error) {
    return NextResponse.json(
      { error: "No se pudo guardar la configuración" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
