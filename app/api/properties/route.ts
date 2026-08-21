// app/api/properties/route.ts
//
// Public — no admin auth needed, unlike /api/admin/properties. Only
// returns fields a visitor should see (no default_price/min_stay
// internals beyond what's needed for display, no ical URLs, etc.).

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BASE_CURRENCY } from "@/lib/currency";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(
      `
      id,
      name,
      slug,
      currency,
      bedrooms,
      bathrooms,
      max_guests,
      children_allowed,
      hide_nightly_price,
      pets_allowed,
      amenities
    `,
    )
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las propiedades" },
      { status: 500 },
    );
  }

  const properties = data.map((property) => ({
    id: property.id,
    name: property.name,
    slug: property.slug,
    currency: BASE_CURRENCY,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.max_guests,
    childrenAllowed: property.children_allowed,
    hideNightlyPrice: property.hide_nightly_price,
    petsAllowed: property.pets_allowed,
    amenities: property.amenities ?? [],
  }));

  return NextResponse.json(properties);
}
