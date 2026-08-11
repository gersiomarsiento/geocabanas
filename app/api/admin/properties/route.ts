import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(
      `
      id,
      name,
      default_price,
      default_min_stay,
      min_reservation_fee,
      hide_nightly_price,
      currency,
      bedrooms,
      bathrooms,
      max_guests,
      children_allowed,
      pets_allowed,
      amenities
    `,
    )
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const properties = data.map((property) => ({
    id: property.id,
    name: property.name,
    defaultPrice: Number(property.default_price),
    defaultMinStay: property.default_min_stay,
    minReservationFee: Number(property.min_reservation_fee),
    hideNightlyPrice: property.hide_nightly_price,
    currency: property.currency,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.max_guests,
    childrenAllowed: property.children_allowed,
    petsAllowed: property.pets_allowed,
    amenities: property.amenities ?? [],
  }));

  return NextResponse.json(properties);
}
