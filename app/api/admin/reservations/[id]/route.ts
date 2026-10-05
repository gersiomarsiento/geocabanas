import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getIcalBookedDates } from "@/lib/booking/availability";
import { nextDate } from "@/lib/calendar/dates";
import { sendReservationStatusEmail } from "@/lib/email/reservationEmails";
import { resolveLocale } from "@/lib/i18n/getEmailMessages";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const status = body?.status;

  if (status !== "confirmed" && status !== "cancelled") {
    return NextResponse.json(
      { error: "Estado inválido (solo 'confirmed' o 'cancelled')" },
      { status: 400 },
    );
  }

  const { data: current, error: loadError } = await supabaseAdmin
    .from("reservations")
    .select(
      `id, group_id, status, property_id, start_date, end_date, guest_name,
       guest_email, guest_phone, total_price, deposit_amount, locale, properties(name)`,
    )
    .eq("id", id)
    .single();

  if (loadError?.code === "PGRST116" || !current) {
    return NextResponse.json(
      { error: "Reserva no encontrada" },
      { status: 404 },
    );
  }
  if (status === "cancelled" && current.status === "cancelled") {
    return NextResponse.json({ ok: true, emailSent: false });
  }
  if (status === "confirmed") {
    if (!["requested", "pending"].includes(current.status)) {
      return NextResponse.json(
        { error: "Solo se pueden confirmar solicitudes o reservas pendientes" },
        { status: 400 },
      );
    }

    // The DB constraint can't see Airbnb/Booking, so check the iCal feed
    // unless the admin has explicitly chosen to override.
    if (!body.force) {
      const { data: property } = await supabaseAdmin
        .from("properties")
        .select("external_ical_url")
        .eq("id", current.property_id)
        .single();

      const ical = await getIcalBookedDates(
        property?.external_ical_url ?? null,
      );
      const conflictDates: string[] = [];
      for (let d = current.start_date; d < current.end_date; d = nextDate(d)) {
        if (ical.has(d)) conflictDates.push(d);
      }
      if (conflictDates.length > 0) {
        return NextResponse.json(
          { error: "ical_conflict", conflictDates },
          { status: 409 },
        );
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  // 23P01: confirming would overlap another pending/confirmed reservation.
  if (error?.code === "23P01") {
    return NextResponse.json(
      {
        error: "overlap",
        message: "Esas fechas ya están ocupadas por otra reserva.",
      },
      { status: 409 },
    );
  }

  if (error || !data) {
    return NextResponse.json(
      { error: "No se pudo actualizar la reserva" },
      { status: 500 },
    );
  }

  let emailSent = false;
  if (body.notify !== false) {
    try {
      const p = Array.isArray(current.properties)
        ? current.properties[0]
        : current.properties;
      const nights = Math.round(
        (new Date(current.end_date).getTime() -
          new Date(current.start_date).getTime()) /
          86_400_000,
      );
      await sendReservationStatusEmail(
        {
          groupId: current.group_id,
          guestName: current.guest_name,
          guestEmail: current.guest_email,
          guestPhone: current.guest_phone,
          locale: resolveLocale(current.locale),
          legs: [
            {
              reservationId: current.id,
              propertyName: p?.name ?? "",
              startDate: current.start_date,
              endDate: current.end_date,
              nights,
              totalPrice: Number(current.total_price),
              depositAmount: Number(current.deposit_amount),
            },
          ],
        },
        status,
      );
      emailSent = true;
    } catch (e) {
      console.error("Status email failed:", e);
    }
  }

  return NextResponse.json({ ok: true, reservation: data, emailSent });
}
