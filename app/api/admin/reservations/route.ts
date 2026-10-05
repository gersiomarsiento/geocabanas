import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isoDate } from "@/lib/calendar/dates";
import type {
  AdminReservation,
  ReservationStatus,
} from "@/types/admin-availability";

const STATUSES: ReservationStatus[] = [
  "requested",
  "pending",
  "confirmed",
  "cancelled",
  "expired",
];

export async function GET(request: Request) {
  const status = new URL(request.url).searchParams.get(
    "status",
  ) as ReservationStatus | null;

  if (!status || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("reservations")
    .select(
      `id, group_id, property_id, guest_name, guest_email, guest_phone,
       start_date, end_date, total_price, deposit_amount, status,
       properties(name, currency)`,
    )
    .eq("status", status)
    .order("start_date", { ascending: status !== "cancelled" })
    .limit(200);

  // Active lists only show stays that haven't ended yet.
  if (status !== "cancelled" && status !== "expired") {
    query = query.gte("end_date", isoDate(new Date()));
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to list reservations:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las reservas" },
      { status: 500 },
    );
  }

  const rows: AdminReservation[] = (data ?? []).map((r) => {
    const p = Array.isArray(r.properties) ? r.properties[0] : r.properties;
    return {
      id: r.id,
      groupId: r.group_id,
      propertyId: r.property_id,
      propertyName: p?.name ?? "—",
      currency: p?.currency ?? "UYU",
      guestName: r.guest_name,
      guestEmail: r.guest_email,
      guestPhone: r.guest_phone,
      startDate: r.start_date,
      endDate: r.end_date,
      totalPrice: Number(r.total_price),
      depositAmount: Number(r.deposit_amount),
      status: r.status,
    };
  });

  return NextResponse.json(rows);
}
