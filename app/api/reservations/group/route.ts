// app/api/reservations/group/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStayAvailability  } from "@/lib/booking/availability";
import { sendReservationEmails } from "@/lib/email/reservationEmails";
import { resolveLocale } from "@/lib/i18n/getEmailMessages";

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

  const failed = revalidated.find(
    ({ availability }) => !availability.available || !availability.minStayOk,
  );

  if (failed) {
    return NextResponse.json(
      {
        error: `${failed.property.name} ya no está disponible para esas fechas. Volvé a buscar.`,
      },
      { status: 409 },
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

  const { data: reservations, error: rpcError } = (await supabaseAdmin.rpc(
    "create_group_reservation",
    {
      p_guest_name: guestName,
      p_guest_email: guestEmail,
      p_guest_phone: guestPhone,
      p_legs: legsPayload,
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

  await Promise.all(
    reservations.map((reservation) => {
      const property = propertyRows.find(
        (p) => p.id === reservation.property_id,
      )!;
      const nights = Math.round(
        (new Date(reservation.end_date).getTime() -
          new Date(reservation.start_date).getTime()) /
          86_400_000,
      );

      return sendReservationEmails({
        reservationId: reservation.id,
        propertyName: property.name,
        guestName,
        guestEmail,
        guestPhone,
        startDate: reservation.start_date,
        endDate: reservation.end_date,
        nights,
        totalPrice: reservation.total_price,
        depositAmount: reservation.deposit_amount,
        locale,
      });
    }),
  );

  return NextResponse.json({
    ok: true,
    reservationIds: reservations.map((r) => r.id),
    totalPrice: reservations.reduce((s, r) => s + Number(r.total_price), 0),
    depositAmount: reservations.reduce(
      (s, r) => s + Number(r.deposit_amount),
      0,
    ),
  });
}
