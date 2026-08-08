// app/api/admin/availability/route.ts — GET handler only.

import { nextDate, expandRangesToDateSet } from "@/lib/calendar/dates";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBookedRanges } from "@/lib/booking/bookingCalendar";
import type {
  AvailabilityResponse,
  BulkUpdatePayload,
  DayRate,
} from "@/types/admin-availability";

// TODO: gate this route behind your admin auth/session check before ship.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const propertyId = searchParams.get("propertyId");
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!propertyId || !year || !month) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const { data: property, error: propertyError } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (propertyError || !property) {
    return NextResponse.json(
      { error: "Propiedad no encontrada" },
      { status: 404 },
    );
  }

  const daysInMonth = new Date(year, month, 0).getDate();

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${daysInMonth}`;

  // NEW: fetch the Booking.com feed alongside overrides/reservations. If
  // it fails (feed down, bad URL), don't take the whole admin calendar
  // down with it — fall back to "no iCal data" for this render.
  const icalPromise = property.booking_ical_url
    ? getBookedRanges(property.booking_ical_url)
        .then((ranges) => expandRangesToDateSet(ranges))
        .catch((err) => {
          console.error("iCal fetch failed for admin calendar:", err);
          return new Set<string>();
        })
    : Promise.resolve(new Set<string>());

  const [{ data: overrides }, { data: reservations }, icalBookedDates] =
    await Promise.all([
      supabaseAdmin
        .from("calendar_days")
        .select("*")
        .eq("property_id", propertyId)
        .gte("date", startDate)
        .lte("date", endDate),

      supabaseAdmin
        .from("reservations")
        .select("*")
        .eq("property_id", propertyId)
        .in("status", ["pending", "confirmed"])
        .lte("start_date", endDate)
        .gte("end_date", startDate),

      icalPromise,
    ]);

  const days: DayRate[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const override = overrides?.find(
      (item) => String(item.date).slice(0, 10) === date,
    );

    // CHANGED: no longer filtered to `status !== "cancelled"` after the
    // fact — the query above already only fetches pending/confirmed, so
    // any match here is by definition active.
    const activeReservation = reservations?.find(
      (item) => date >= item.start_date && date < item.end_date,
    );

    const icalBooked = icalBookedDates.has(date);

    // Precedence: an active reservation is your own authoritative data
    // and always wins. Otherwise an explicit override wins. Otherwise
    // fall back to what Booking.com's feed says.
    let available: boolean;
    if (activeReservation) {
      available = false;
    } else if (override?.status === "blocked") {
      available = false;
    } else if (override?.status === "available") {
      available = true; // force-open, meaningful for overriding stale iCal data
    } else if (icalBooked) {
      available = false;
    } else {
      available = true;
    }

    days.push({
      date,
      available,
      // CHANGED: was `reservation?.status === "confirmed"` — a pending
      // reservation (like the one that caused the earlier confusion)
      // now correctly shows as reserved too.
      reserved: Boolean(activeReservation),
      price: override?.price ?? property.default_price ?? null,
      minStay: override?.min_stay ?? property.default_min_stay ?? null,
    });
  }

  const response: AvailabilityResponse = {
    propertyId,
    days,
  };

  return NextResponse.json(response);
}

// TODO: gate this route behind your admin auth/session check before ship.

export async function PATCH(request: Request) {
    const body = (await request.json()) as BulkUpdatePayload & {
      confirmIcalOverride?: boolean;
    };
    const { propertyId, startDate, endDate, available, price, minStay, confirmIcalOverride } = body;
   
    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }
   
    const { data: property, error: propertyError } = await supabaseAdmin
      .from("properties")
      .select("id, booking_ical_url")
      .eq("id", propertyId)
      .single();
   
    if (propertyError || !property) {
      return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
    }
   
    if (startDate > endDate) {
      return NextResponse.json({ error: "El rango de fechas es inválido" }, { status: 400 });
    }
   
    const { data: reservations } = await supabaseAdmin
      .from("reservations")
      .select("id, guest_name, guest_email, guest_phone, status, start_date, end_date")
      .eq("property_id", propertyId)
      .in("status", ["pending", "confirmed"])
      .lte("start_date", endDate)
      .gte("end_date", startDate);
   
    const reservationByDate = new Map<string, NonNullable<typeof reservations>[number]>();
    reservations?.forEach((reservation) => {
      let date = reservation.start_date;
      while (date < reservation.end_date) {
        if (!reservationByDate.has(date)) reservationByDate.set(date, reservation);
        date = nextDate(date);
      }
    });
   
    // NEW: same iCal fetch GET uses, so PATCH knows which dates are
    // Booking.com/Airbnb conflicts, not just internal reservation conflicts.
    const icalBookedDates = property.booking_ical_url
      ? await getBookedRanges(property.booking_ical_url)
          .then((ranges) => expandRangesToDateSet(ranges))
          .catch((err) => {
            console.error("iCal fetch failed during PATCH:", err);
            return new Set<string>();
          })
      : new Set<string>();
   
    const updatedDates: string[] = [];
    const skippedDates: {
      date: string;
      reservation: {
        id: string;
        guestName: string;
        guestEmail: string;
        guestPhone: string | null;
        status: string;
        startDate: string;
        endDate: string;
      };
    }[] = [];
    // NEW: separate bucket for iCal-only conflicts — these are NOT locked
    // the way reservation conflicts are. Resending the same request with
    // confirmIcalOverride: true will let these specific dates through.
    const icalConflictDates: string[] = [];
    const failedDates: { date: string; error: string }[] = [];
   
    let current = startDate;
   
    while (current <= endDate) {
      // Reservation conflicts are never overridable from this endpoint,
      // regardless of confirmIcalOverride — that flag only ever applies
      // to iCal conflicts, checked separately below.
      const reservation = reservationByDate.get(current);
      if (reservation) {
        skippedDates.push({
          date: current,
          reservation: {
            id: reservation.id,
            guestName: reservation.guest_name,
            guestEmail: reservation.guest_email,
            guestPhone: reservation.guest_phone,
            status: reservation.status,
            startDate: reservation.start_date,
            endDate: reservation.end_date,
          },
        });
        current = nextDate(current);
        continue;
      }
   
      // iCal conflict, first pass without confirmation -> report, don't write.
      if (icalBookedDates.has(current) && !confirmIcalOverride) {
        icalConflictDates.push(current);
        current = nextDate(current);
        continue;
      }
   
      const { data: existing } = await supabaseAdmin
        .from("calendar_days")
        .select("*")
        .eq("property_id", propertyId)
        .eq("date", current)
        .maybeSingle();
   
      const update: Record<string, unknown> = {};
      if (available !== undefined) update.status = available ? null : "blocked";
      if (price !== undefined) update.price = price;
      if (minStay !== undefined) update.min_stay = minStay;
   
      if (existing) {
        const { error } = await supabaseAdmin
          .from("calendar_days")
          .update(update)
          .eq("id", existing.id);
   
        if (error) failedDates.push({ date: current, error: error.message });
        else updatedDates.push(current);
      } else {
        const { error } = await supabaseAdmin.from("calendar_days").insert({
          property_id: propertyId,
          date: current,
          status: available === false ? "blocked" : "available",
          price: price ?? null,
          min_stay: minStay ?? null,
        });
   
        if (error) failedDates.push({ date: current, error: error.message });
        else updatedDates.push(current);
      }
   
      current = nextDate(current);
    }
   
    return NextResponse.json({
      ok: failedDates.length === 0,
      updatedDates,
      skippedDates, // reservation conflicts — only fixable by cancelling the reservation
      icalConflictDates, // Booking.com/Airbnb conflicts — resend with confirmIcalOverride: true to force
      failedDates,
    });
  }
