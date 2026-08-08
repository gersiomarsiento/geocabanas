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
      currency
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
    currency: property.currency,
  }));

  return NextResponse.json(properties);
}
