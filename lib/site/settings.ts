// lib/site/settings.ts

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface ContactSettings {
  contactWhatsapp: string | null;
  contactEmail: string | null;
  contactInstagram: string | null; // handle only, e.g. "geocabanas" — no @ or full URL
  mapLatitude: number | null;
  mapLongitude: number | null;
  mapAddress: string | null;
}

export async function getContactSettings(): Promise<ContactSettings> {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select(
      "contact_whatsapp, contact_email, contact_instagram, map_latitude, map_longitude, map_address",
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
    };
  }

  return {
    contactWhatsapp: data.contact_whatsapp,
    contactEmail: data.contact_email,
    contactInstagram: data.contact_instagram,
    mapLatitude: data.map_latitude,
    mapLongitude: data.map_longitude,
    mapAddress: data.map_address,
  };
}
