// app/api/admin/properties/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PropertySettingsUpdate } from "@/types/admin-availability";

// TODO: gate this route behind your admin auth/session check before ship.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as PropertySettingsUpdate;

  const update: Record<string, unknown> = {};
  if (body.name != null && body.name.trim() !== "") update.name = body.name.trim();
  if (body.defaultPrice != null) update.default_price = body.defaultPrice;
  if (body.defaultMinStay != null)
    update.default_min_stay = body.defaultMinStay;
  if (body.minReservationFee != null)
    update.min_reservation_fee = body.minReservationFee;
  if (body.bedrooms != null) update.bedrooms = body.bedrooms;
  if (body.bathrooms != null) update.bathrooms = body.bathrooms;
  if (body.maxGuests != null) update.max_guests = body.maxGuests;
  if (body.childrenAllowed != null)
    update.children_allowed = body.childrenAllowed;
  if (body.petsAllowed != null) update.pets_allowed = body.petsAllowed;
  if (body.hideNightlyPrice != null) update.hide_nightly_price = body.hideNightlyPrice;
  if (body.amenities != null) update.amenities = body.amenities;

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No hay cambios para guardar" },
      { status: 400 },
    );
  }

  const { data: property, error } = await supabaseAdmin
    .from("properties")
    .update(update)
    .eq("id", id)
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
    .single();

  if (error || !property) {
    return NextResponse.json(
      { error: "Propiedad no encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: property.id,
    name: property.name,
    defaultPrice: Number(property.default_price),
    defaultMinStay: property.default_min_stay,
    minReservationFee: Number(property.min_reservation_fee),
    currency: property.currency,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.max_guests,
    childrenAllowed: property.children_allowed,
    hideNightlyPrice: property.hide_nightly_price,
    petsAllowed: property.pets_allowed,
    amenities: property.amenities ?? [],
  });
}
