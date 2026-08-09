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
  if (body.defaultPrice != null) update.default_price = body.defaultPrice;
  if (body.defaultMinStay != null)
    update.default_min_stay = body.defaultMinStay;
  if (body.minReservationFee != null)
    update.min_reservation_fee = body.minReservationFee;

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
      "id, name, default_price, default_min_stay, min_reservation_fee, currency",
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
  });
}
