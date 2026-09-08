// lib/booking/availability.ts
//
// Single source of truth for the availability-precedence rule used across
// visitor availability, admin availability, reservation creation, and
// booking/search + reservations/group. Previously duplicated across all
// four (see TO_DO.md — "Refactor opportunity").
//
// Precedence (agreed across all four original copies): an active
// pending/confirmed reservation always blocks a date, unconditionally.
// Otherwise a manual "blocked" override blocks it, and a manual
// "available" override force-opens it over a stale iCal booking.
// Otherwise iCal blocks it. Otherwise it's open.
//
// Two shapes, because callers need two different things:
//   - getPropertyAvailabilityDays: a per-day list for calendar UIs
//     (visitor + admin GET). Inclusive start/end.
//   - getStayAvailability: a single yes/no + price + nights for
//     validating one candidate stay (reservation creation, search,
//     group creation). Exclusive end (checkout), matching how nights
//     are counted everywhere else in the project.
//
// NOTE on min-stay: requiredMinStay is anchored to the check-in date's
// calendar_days.min_stay override, falling back to the property default.
// This matches BookingCalendar.tsx's existing client-side check
// (getDayInfo(startDate).minStay) — previously the server never enforced
// this at all, see TO_DO.md.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBookedRanges } from "./bookingCalendar";
import { nextDate, expandRangesToDateSet } from "@/lib/calendar/dates";

export async function getIcalBookedDates(
  icalUrl: string | null,
): Promise<Set<string>> {
  if (!icalUrl) return new Set<string>();
  try {
    const ranges = await getBookedRanges(icalUrl);
    return expandRangesToDateSet(ranges);
  } catch (err) {
    // Fail open — never let a flaky external feed take down availability.
    console.error("iCal fetch failed:", err);
    return new Set<string>();
  }
}

export interface PropertyAvailabilityDay {
  date: string;
  available: boolean;
  reserved: boolean;
  price: number;
  minStay: number | null;
}

export async function getPropertyAvailabilityDays(
  propertyId: string,
  startDate: string, // inclusive
  endDate: string, // inclusive
): Promise<PropertyAvailabilityDay[]> {
  const { data: property, error: propertyError } = await supabaseAdmin
    .from("properties")
    .select("id, default_price, default_min_stay, external_ical_url")
    .eq("id", propertyId)
    .single();

  if (propertyError || !property) {
    throw new Error("Property not found");
  }

  const icalBookedDates = await getIcalBookedDates(property.external_ical_url);

  const [{ data: overrides }, { data: reservations }] = await Promise.all([
    supabaseAdmin
      .from("calendar_days")
      .select("date, status, price, min_stay")
      .eq("property_id", propertyId)
      .gte("date", startDate)
      .lte("date", endDate),

    supabaseAdmin
      .from("reservations")
      .select("start_date, end_date")
      .eq("property_id", propertyId)
      .in("status", ["pending", "confirmed"])
      .lte("start_date", endDate)
      .gt("end_date", startDate),
  ]);

  const days: PropertyAvailabilityDay[] = [];
  let current = startDate;

  while (current <= endDate) {
    const override = overrides?.find(
      (item) => String(item.date).slice(0, 10) === current,
    );
    const activeReservation = reservations?.find(
      (item) => current >= item.start_date && current < item.end_date,
    );
    const icalBooked = icalBookedDates.has(current);

    const blocked = override?.status === "blocked";
    const forcedOpen = override?.status === "available";

    const available =
      !activeReservation && (forcedOpen || !(blocked || icalBooked));

    days.push({
      date: current,
      available,
      reserved: Boolean(activeReservation),
      price: Number(override?.price ?? property.default_price ?? 0),
      minStay: override?.min_stay ?? property.default_min_stay ?? null,
    });

    current = nextDate(current);
  }

  return days;
}

export interface StayAvailability {
  available: boolean;
  totalPrice: number;
  nights: number;
  minStayOk: boolean;
  requiredMinStay: number;
  blockingDate: string | null;
}

export async function getStayAvailability(
  propertyId: string,
  startDate: string, // check-in, inclusive
  endDate: string, // check-out, exclusive
): Promise<StayAvailability> {
  const { data: property, error: propertyError } = await supabaseAdmin
    .from("properties")
    .select("id, default_price, default_min_stay, external_ical_url")
    .eq("id", propertyId)
    .single();

  if (propertyError || !property) {
    throw new Error("Property not found");
  }

  const icalBookedDates = await getIcalBookedDates(property.external_ical_url);

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

  const checkInOverride = overrides?.find(
    (item) => String(item.date).slice(0, 10) === startDate,
  );
  const requiredMinStay =
    checkInOverride?.min_stay ?? property.default_min_stay ?? 1;

  if (existingReservations && existingReservations.length > 0) {
    return {
      available: false,
      totalPrice: 0,
      nights: 0,
      minStayOk: false,
      requiredMinStay,
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

  return {
    available: blockingDate === null,
    totalPrice,
    nights,
    minStayOk: nights >= requiredMinStay,
    requiredMinStay,
    blockingDate,
  };
}
