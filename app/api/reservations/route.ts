// app/api/reservations/route.ts
//
// Public endpoint. Re-checks everything server-side rather than trusting
// whatever the visitor's browser thinks is available — the calendar UI
// can go stale (another tab, a slow network, someone else booking a
// second ago), so this is the actual source of truth for "can this
// reservation happen."
//
// ASSUMPTION: reservations has `total_price` and `deposit_amount`
// numeric columns, and `status` defaulting to 'pending' — matching the
// schema from early on. If those columns aren't actually there, this
// insert will fail loudly (not silently), which will tell us fast.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBookedRanges } from "@/lib/booking/bookingCalendar";
import { expandRangesToDateSet, nextDate, isoDate } from "@/lib/calendar/dates";
import { sendReservationEmails } from "@/lib/email/reservationEmails";

interface ReservationRequest {
  propertyId: string;
  startDate: string; // check-in, inclusive
  endDate: string; // check-out, exclusive — matches how nights are counted elsewhere
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReservationRequest;
  const { propertyId, startDate, endDate, guestName, guestEmail, guestPhone } =
    body;

  if (
    !propertyId ||
    !startDate ||
    !endDate ||
    !guestName ||
    !guestEmail ||
    !guestPhone
  ) {
    return NextResponse.json(
      { error: "Faltan datos requeridos" },
      { status: 400 },
    );
  }

  if (startDate >= endDate) {
    return NextResponse.json(
      { error: "El rango de fechas es inválido" },
      { status: 400 },
    );
  }

  const { data: property, error: propertyError } = await supabaseAdmin
    .from("properties")
    .select(
      "id, name, default_price, default_min_stay, deposit_percentage, booking_ical_url",
    )
    .eq("id", propertyId)
    .single();

  if (propertyError || !property) {
    return NextResponse.json(
      { error: "Propiedad no encontrada" },
      { status: 404 },
    );
  }

  // Don't allow reservations that start in the past.
  if (startDate < isoDate(new Date())) {
    return NextResponse.json(
      { error: "La fecha de entrada ya pasó" },
      { status: 400 },
    );
  }

  // --- Re-check availability for every night, same three sources the
  // calendars use (iCal, calendar_days overrides, existing reservations) ---

  const icalBookedDates = property.booking_ical_url
    ? await getBookedRanges(property.booking_ical_url)
        .then((ranges) => expandRangesToDateSet(ranges))
        .catch(() => new Set<string>()) // fail open on iCal errors — don't block a real booking over a feed hiccup
    : new Set<string>();

  const [{ data: overrides }, { data: existingReservations }] =
    await Promise.all([
      supabaseAdmin
        .from("calendar_days")
        .select("date, status, price, min_stay")
        .eq("property_id", propertyId)
        .gte("date", startDate)
        .lt("date", endDate),

      supabaseAdmin
        .from("reservations")
        .select("start_date, end_date")
        .eq("property_id", propertyId)
        .in("status", ["pending", "confirmed"])
        .lt("start_date", endDate)
        .gt("end_date", startDate),
    ]);

  if (existingReservations && existingReservations.length > 0) {
    return NextResponse.json(
      { error: "Esas fechas ya no están disponibles. Elegí otra estadía." },
      { status: 409 },
    );
  }

  let totalPrice = 0;
  let nights = 0;
  let current = startDate;

  while (current < endDate) {
    const override = overrides?.find(
      (item) => String(item.date).slice(0, 10) === current,
    );

    const blocked = override?.status === "blocked";
    const forcedOpen = override?.status === "available";
    const icalBooked = icalBookedDates.has(current);

    const unavailable = !forcedOpen && (blocked || icalBooked);
    if (unavailable) {
      return NextResponse.json(
        {
          error: `La fecha ${current} ya no está disponible. Elegí otra estadía.`,
        },
        { status: 409 },
      );
    }

    totalPrice += override?.price ?? property.default_price ?? 0;
    nights += 1;
    current = nextDate(current);
  }

  const minStay = property.default_min_stay ?? 1;
  if (nights < minStay) {
    return NextResponse.json(
      { error: `La estadía mínima para estas fechas es de ${minStay} noches.` },
      { status: 400 },
    );
  }

  const depositAmount = totalPrice * ((property.deposit_percentage ?? 0) / 100);

  const { data: reservation, error: insertError } = await supabaseAdmin
    .from("reservations")
    .insert({
      property_id: propertyId,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone ?? null,
      start_date: startDate,
      end_date: endDate,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !reservation) {
    console.error("Reservation insert failed:", insertError);
    return NextResponse.json(
      { error: "No se pudo crear la reserva" },
      { status: 500 },
    );
  }

  await sendReservationEmails({
    reservationId: reservation.id,
    propertyName: property.name,
    guestName,
    guestEmail,
    guestPhone: guestPhone ?? null,
    startDate,
    endDate,
    nights,
    totalPrice,
    depositAmount,
  });

  return NextResponse.json({
    ok: true,
    reservationId: reservation.id,
    nights,
    totalPrice,
    depositAmount,
  });
}
