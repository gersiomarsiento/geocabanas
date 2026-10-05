// app/api/reservations/group/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStayAvailability } from "@/lib/booking/availability";
import {
  sendReservationEmails,
  type ReservationLeg,
} from "@/lib/email/reservationEmails";
import { resolveLocale } from "@/lib/i18n/getEmailMessages";
import { getContactSettings } from "@/lib/site/settings";

interface GroupLeg {
  propertyId: string;
  startDate: string;
  endDate: string;
}

interface GroupReservationRequest {
  legs: GroupLeg[];
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  locale?: string;
}

interface GroupReservationRow {
  id: string;
  group_id: string | null;
  property_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  deposit_amount: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as GroupReservationRequest;
  const { legs, guestName, guestEmail, guestPhone } = body;
  const locale = resolveLocale(body.locale);

  if (!legs?.length || !guestName || !guestEmail || !guestPhone) {
    return NextResponse.json(
      { error: "Faltan datos requeridos" },
      { status: 400 },
    );
  }

  const { data: propertyRows, error: propertiesError } = await supabaseAdmin
    .from("properties")
    .select("id, name, deposit_percentage")
    .in(
      "id",
      legs.map((l) => l.propertyId),
    );

  if (propertiesError || !propertyRows || propertyRows.length !== legs.length) {
    return NextResponse.json(
      { error: "Una de las propiedades no existe" },
      { status: 404 },
    );
  }

  // Revalidar cada leg contra la disponibilidad real, no la que devolvió
  // la búsqueda hace un rato — puede haberse ocupado mientras tanto.
  const revalidated = await Promise.all(
    legs.map(async (leg) => {
      const property = propertyRows.find((p) => p.id === leg.propertyId)!;
      const availability = await getStayAvailability(
        leg.propertyId,
        leg.startDate,
        leg.endDate,
      );
      return { leg, property, availability };
    }),
  );

  const unavailable = revalidated.find(
    ({ availability }) => !availability.available,
  );

  if (unavailable) {
    return NextResponse.json(
      {
        error: `${unavailable.property.name} ya no está disponible para esas fechas. Volvé a buscar.`,
      },
      { status: 409 },
    );
  }

  const shortStay = revalidated.find(
    ({ availability }) => !availability.minStayOk,
  );

  if (shortStay) {
    return NextResponse.json(
      {
        error: `${shortStay.property.name}: la estadía mínima para estas fechas es de ${shortStay.availability.requiredMinStay} noches.`,
      },
      { status: 400 },
    );
  }

  const legsPayload = revalidated.map(({ leg, property, availability }) => ({
    property_id: leg.propertyId,
    start_date: leg.startDate,
    end_date: leg.endDate,
    total_price: availability.totalPrice,
    deposit_amount:
      availability.totalPrice * ((property.deposit_percentage ?? 0) / 100),
  }));

  const { bookingMode } = await getContactSettings();

  const { data: reservations, error: rpcError } = (await supabaseAdmin.rpc(
    "create_group_reservation",
    {
      p_guest_name: guestName,
      p_guest_email: guestEmail,
      p_guest_phone: guestPhone,
      p_legs: legsPayload,
      p_status: bookingMode === "request" ? "requested" : "pending",
    },
  )) as {
    data: GroupReservationRow[] | null;
    error: { code?: string; message: string } | null;
  };

  if (rpcError || !reservations) {
    if (rpcError?.code === "23P01") {
      return NextResponse.json(
        {
          error:
            "Una de las cabañas se reservó justo ahora. Volvé a buscar disponibilidad.",
        },
        { status: 409 },
      );
    }
    console.error("Group reservation insert failed:", rpcError);
    return NextResponse.json(
      { error: "No se pudo crear la reserva grupal" },
      { status: 500 },
    );
  }

  // The RPC doesn't know about locale; store it so the confirm/cancel
  // emails sent later from the admin use the guest's language.
  const { error: localeError } = await supabaseAdmin
    .from("reservations")
    .update({ locale })
    .in(
      "id",
      reservations.map((r) => r.id),
    );
  if (localeError) console.error("Failed to store locale:", localeError);

  const groupId = reservations[0].group_id ?? null;

  const emailLegs: ReservationLeg[] = reservations.map((reservation) => {
    const property = propertyRows.find(
      (p) => p.id === reservation.property_id,
    )!;
    const nights = Math.round(
      (new Date(reservation.end_date).getTime() -
        new Date(reservation.start_date).getTime()) /
        86_400_000,
    );
    return {
      reservationId: reservation.id,
      propertyName: property.name,
      startDate: reservation.start_date,
      endDate: reservation.end_date,
      nights,
      totalPrice: Number(reservation.total_price),
      depositAmount: Number(reservation.deposit_amount),
    };
  });

  // One email to the guest and one to the admin for the whole group.
  let guestWhatsappUrl: string | null = null;
  try {
    ({ guestWhatsappUrl } = await sendReservationEmails({
      groupId,
      legs: emailLegs,
      guestName,
      guestEmail,
      guestPhone,
      locale,
    }));
  } catch (e) {
    console.error("Group reservation email failed:", e);
  }

  return NextResponse.json({
    ok: true,
    bookingMode,
    groupId,
    reservationIds: reservations.map((r) => r.id),
    totalPrice: reservations.reduce((s, r) => s + Number(r.total_price), 0),
    depositAmount: reservations.reduce(
      (s, r) => s + Number(r.deposit_amount),
      0,
    ),
    whatsappUrl: guestWhatsappUrl,
  });
}
