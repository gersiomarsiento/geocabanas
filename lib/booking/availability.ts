import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBookedRanges } from "./bookingCalendar";

import { nextDate } from "@/lib/calendar/dates";
import { expandRangesToDateSet } from "@/lib/calendar/dates";

export type AvailabilityResult = {
  available: boolean;
  reason:
    | "booking"
    | "manual_block"
    | "pending_reservation"
    | "confirmed_reservation"
    | null;
};

export interface RangeAvailability {
  available: boolean;
  totalPrice: number;
  nights: number;
  minStayOk: boolean;
  blockingDate: string | null;
}

export async function isDateAvailable(
  propertyId: string,
  date: string,
): Promise<AvailabilityResult> {
  // 1. Revisar External site
  const { data: property, error: propertyError } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (propertyError || !property) {
    throw new Error("Property not found");
  }

  const bookingRanges = property.external_ical_url
    ? await getBookedRanges(property.external_ical_url)
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

export async function getRangeAvailability(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<RangeAvailability> {
  const { data: property, error: propertyError } = await supabaseAdmin
    .from("properties")
    .select("id, default_price, default_min_stay, external_ical_url")
    .eq("id", propertyId)
    .single();

  if (propertyError || !property) {
    throw new Error("Property not found");
  }

  const icalBookedDates = property.external_ical_url
    ? await getBookedRanges(property.external_ical_url)
        .then((ranges) => expandRangesToDateSet(ranges))
        .catch(() => new Set<string>())
    : new Set<string>();

  const [{ data: overrides }, { data: existingReservations }] =
    await Promise.all([
      supabaseAdmin
        .from("calendar_days")
        .select("date, status, price")
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
    return {
      available: false,
      totalPrice: 0,
      nights: 0,
      minStayOk: false,
      blockingDate: startDate,
    };
  }

  let totalPrice = 0;
  let nights = 0;
  let current = startDate;
  let blockingDate: string | null = null;

  while (current < endDate) {
    const override = overrides?.find(
      (item) => String(item.date).slice(0, 10) === current,
    );

    const blocked = override?.status === "blocked";
    const forcedOpen = override?.status === "available";
    const icalBooked = icalBookedDates.has(current);

    if (!forcedOpen && (blocked || icalBooked)) {
      blockingDate = current;
      break;
    }

    totalPrice += Number(override?.price ?? property.default_price ?? 0);
    nights += 1;
    current = nextDate(current);
  }

  const minStay = property.default_min_stay ?? 1;

  return {
    available: blockingDate === null,
    totalPrice,
    nights,
    minStayOk: nights >= minStay,
    blockingDate,
  };
}
