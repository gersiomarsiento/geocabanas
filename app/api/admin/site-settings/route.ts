// app/api/admin/site-settings/route.ts
//
// PATCH -> updates contact/map fields on the singleton site_settings row.

// TODO: gate this route behind your admin auth/session check before ship.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface SiteSettingsUpdate {
  contactWhatsapp?: string;
  contactEmail?: string;
  contactInstagram?: string;
  mapLatitude?: number;
  mapLongitude?: number;
  mapAddress?: string;
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as SiteSettingsUpdate;

  const update: Record<string, unknown> = {};
  if (body.contactWhatsapp != null)
    update.contact_whatsapp = body.contactWhatsapp;
  if (body.contactEmail != null) update.contact_email = body.contactEmail;
  if (body.contactInstagram != null) update.contact_instagram = body.contactInstagram;
  if (body.mapLatitude != null) update.map_latitude = body.mapLatitude;
  if (body.mapLongitude != null) update.map_longitude = body.mapLongitude;
  if (body.mapAddress != null) update.map_address = body.mapAddress;

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No hay cambios para guardar" },
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
