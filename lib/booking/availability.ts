import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBookedRanges } from "./bookingCalendar";

export type AvailabilityResult = {
  available: boolean;
  reason:
    | "booking"
    | "manual_block"
    | "pending_reservation"
    | "confirmed_reservation"
    | null;
};

export async function isDateAvailable(
  propertyId: string,
  date: string,
): Promise<AvailabilityResult> {
  // 1. Revisar Booking.com
  const { data: property, error: propertyError } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (propertyError || !property) {
    throw new Error("Property not found");
  }

  const bookingRanges = property.booking_ical_url
    ? await getBookedRanges(property.booking_ical_url)
    : [];

  const bookedExternally = bookingRanges.some((range) => {
    return date >= range.start && date < range.end;
  });

  if (bookedExternally) {
    return {
      available: false,
      reason: "booking",
    };
  }

  // 2. Revisar bloqueos manuales

  const { data: blockedDay } = await supabaseAdmin
    .from("calendar_days")
    .select("id")
    .eq("property_id", propertyId)
    .eq("date", date)
    .eq("status", "blocked")
    .maybeSingle();

  if (blockedDay) {
    return {
      available: false,
      reason: "manual_block",
    };
  }

  // 3. Revisar reservas propias

  const { data: reservations } = await supabaseAdmin
    .from("reservations")
    .select("status, expires_at")
    .eq("property_id", propertyId)
    .in("status", ["pending", "confirmed"])
    .lte("start_date", date)
    .gt("end_date", date);

  const now = new Date();

  for (const reservation of reservations ?? []) {
    if (reservation.status === "confirmed") {
      return {
        available: false,
        reason: "confirmed_reservation",
      };
    }

    if (
      reservation.status === "pending" &&
      reservation.expires_at &&
      new Date(reservation.expires_at) > now
    ) {
      return {
        available: false,
        reason: "pending_reservation",
      };
    }
  }

  return {
    available: true,
    reason: null,
  };
}

export async function getAvailabilityRange(
  propertyId: string,
  startDate: string,
  endDate: string,
) {
  const dates: string[] = [];

  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));

    current.setDate(current.getDate() + 1);
  }

  const availability = await Promise.all(
    dates.map(async (date) => {
      const result = await isDateAvailable(propertyId, date);

      return {
        date,
        ...result,
      };
    }),
  );

  return availability;
}
