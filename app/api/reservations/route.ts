// app/api/reservations/route.ts
//
// Public endpoint. Re-checks everything server-side rather than trusting
// whatever the visitor's browser thinks is available — the calendar UI
// can go stale (another tab, a slow network, someone else booking a
// second ago), so this is the actual source of truth for "can this
// reservation happen."
//
// Availability/pricing/min-stay checks now come from getStayAvailability
// (lib/booking/availability.ts) instead of a fourth inline copy of the
// same logic — see TO_DO.md "Refactor opportunity".
//
// ASSUMPTION: reservations has `total_price` and `deposit_amount`
// numeric columns, and `status` defaulting to 'pending' — matching the
// schema from early on. If those columns aren't actually there, this
// insert will fail loudly (not silently), which will tell us fast.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStayAvailability } from "@/lib/booking/availability";
import { isoDate } from "@/lib/calendar/dates";
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
      "id, name, default_price, default_min_stay, deposit_percentage, external_ical_url",
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

  const availability = await getStayAvailability(
    propertyId,
    startDate,
    endDate,
  );

  if (!availability.available) {
    return NextResponse.json(
      {
        error: availability.blockingDate
          ? `La fecha ${availability.blockingDate} ya no está disponible. Elegí otra estadía.`
          : "Esas fechas ya no están disponibles. Elegí otra estadía.",
      },
      { status: 409 },
    );
  }

  if (!availability.minStayOk) {
    return NextResponse.json(
      {
        error: `La estadía mínima para estas fechas es de ${availability.requiredMinStay} noches.`,
      },
      { status: 400 },
    );
  }

  const { totalPrice, nights } = availability;
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
    // 23P01 = Postgres exclusion_violation — the reservations_no_overlap
    // constraint caught an overlap that slipped past the check above
    // (two near-simultaneous requests for the same dates). This is the
    // race condition the constraint exists to close; treat it exactly
    // like the earlier availability check failing.
    if (insertError?.code === "23P01") {
      return NextResponse.json(
        { error: "Esas fechas ya no están disponibles. Elegí otra estadía." },
        { status: 409 },
      );
    }

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
