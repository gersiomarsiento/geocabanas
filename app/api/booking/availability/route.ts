// app/api/booking/availability/route.ts
//
// Per-day availability + price for the visitor-facing single-property
// calendar. Precedence logic now comes from getPropertyAvailabilityDays
// (lib/booking/availability.ts) instead of a fourth inline copy — see
// TO_DO.md "Refactor opportunity".

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPropertyAvailabilityDays } from "@/lib/booking/availability";
import { isoDate } from "@/lib/calendar/dates";
import { BASE_CURRENCY } from "@/lib/currency";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("property");
  const daysAhead = Number(searchParams.get("days") ?? 365);

  try {
    let query = supabaseAdmin
      .from("properties")
      .select(
        "id, name, slug, currency, default_price, default_min_stay, external_ical_url",
      )
      .limit(1);
    if (slug) query = query.eq("slug", slug);

    const { data: properties, error: propertyError } = await query;

    if (propertyError || !properties?.length) {
      return NextResponse.json(
        { error: "Propiedad no encontrada" },
        { status: 404 },
      );
    }

    const property = properties[0];

    const start = isoDate(new Date());
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + daysAhead);
    const end = isoDate(endDateObj);

    const days = await getPropertyAvailabilityDays(property.id, start, end);

    return NextResponse.json({
      property: {
        id: property.id,
        name: property.name,
        slug: property.slug,
        currency: BASE_CURRENCY,
      },
      days: days.map(({ date, available, price, minStay }) => ({
        date,
        available,
        price,
        minStay,
      })),
    });
  } catch (err) {
    console.error("Availability fetch failed:", err);
    return NextResponse.json(
      { error: "No se pudo cargar la disponibilidad" },
      { status: 502 },
    );
  }
}
