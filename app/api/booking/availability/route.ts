// app/api/booking/availability/route.ts
//
// REPLACES the current bookedRanges-only version. Now returns a
// per-day array with price, merging the same three sources the admin
// route uses (iCal, calendar_days overrides, reservations) — but
// stripped down to only what a visitor should see: no guest info, no
// internal reservation status detail, just available + price.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBookedRanges } from "@/lib/booking/bookingCalendar";
import { expandRangesToDateSet, isoDate } from "@/lib/calendar/dates";
import { BASE_CURRENCY } from "@/lib/currency";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("property");
  const daysAhead = Number(searchParams.get("days") ?? 365);

  try {
    let query = supabaseAdmin
      .from("properties")
      .select(
        "id, name, slug, currency, default_price, default_min_stay, booking_ical_url",
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

    const icalBookedDates = property.booking_ical_url
      ? await getBookedRanges(property.booking_ical_url)
          .then((ranges) => expandRangesToDateSet(ranges))
          .catch((err) => {
            console.error("iCal fetch failed for visitor calendar:", err);
            return new Set<string>();
          })
      : new Set<string>();

    const [{ data: overrides }, { data: reservations }] = await Promise.all([
      supabaseAdmin
        .from("calendar_days")
        .select("date, status, price, min_stay")
        .eq("property_id", property.id)
        .gte("date", start)
        .lte("date", end),

      supabaseAdmin
        .from("reservations")
        .select("start_date, end_date")
        .eq("property_id", property.id)
        .in("status", ["pending", "confirmed"])
        .lte("start_date", end)
        .gte("end_date", start),
    ]);

    const days: {
      date: string;
      available: boolean;
      price: number | null;
      minStay: number | null;
    }[] = [];

    const cur = new Date(start);
    const endTime = new Date(end).getTime();

    while (cur.getTime() <= endTime) {
      const date = isoDate(cur);

      const override = overrides?.find(
        (item) => String(item.date).slice(0, 10) === date,
      );
      const activeReservation = reservations?.find(
        (item) => date >= item.start_date && date < item.end_date,
      );
      const icalBooked = icalBookedDates.has(date);

      let available: boolean;
      if (activeReservation) available = false;
      else if (override?.status === "blocked") available = false;
      else if (override?.status === "available") available = true;
      else if (icalBooked) available = false;
      else available = true;

      days.push({
        date,
        available,
        price: Number(override?.price ?? property.default_price ?? 0),
        minStay: override?.min_stay ?? property.default_min_stay ?? null,
      });

      cur.setDate(cur.getDate() + 1);
    }

    return NextResponse.json({
      property: {
        id: property.id,
        name: property.name,
        slug: property.slug,
        currency: BASE_CURRENCY,
      },
      days,
    });
  } catch (err) {
    console.error("Availability fetch failed:", err);
    return NextResponse.json(
      { error: "No se pudo cargar la disponibilidad" },
      { status: 502 },
    );
  }
}
