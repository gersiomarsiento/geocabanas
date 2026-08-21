import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ical, { ICalCalendarMethod } from "ical-generator";
import { getBookedRanges } from "@/lib/booking/bookingCalendar";
import { expandRangesToDateSet, nextDate, isoDate } from "@/lib/calendar/dates";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const { data: property, error } = await supabaseAdmin
    .from("properties")
    .select("id, name, booking_ical_url")
    .eq("slug", slug)
    .single();

  if (error || !property) {
    return new NextResponse("Property not found", { status: 404 });
  }

  const start = isoDate(new Date());
  const endObj = new Date();
  endObj.setDate(endObj.getDate() + 365); // matches Airbnb's own 365-day import cap
  const end = isoDate(endObj);

  const icalBookedDates = property.booking_ical_url
    ? await getBookedRanges(property.booking_ical_url)
        .then(expandRangesToDateSet)
        .catch(() => new Set<string>())
    : new Set<string>();

  const [{ data: overrides }, { data: reservations }] = await Promise.all([
    supabaseAdmin
      .from("calendar_days")
      .select("date, status")
      .eq("property_id", property.id)
      .gte("date", start)
      .lte("date", end),
    supabaseAdmin
      .from("reservations")
      .select("start_date, end_date")
      .eq("property_id", property.id)
      .in("status", ["pending", "confirmed"])
      .lte("start_date", end)
      .gte("end_date", start),
  ]);

  const unavailable = new Set<string>();
  let current = start;
  while (current <= end) {
    const override = overrides?.find(
      (o) => String(o.date).slice(0, 10) === current,
    );
    const reserved = reservations?.some(
      (r) => current >= r.start_date && current < r.end_date,
    );
    const blocked =
      reserved ||
      override?.status === "blocked" ||
      (icalBookedDates.has(current) && override?.status !== "available");
    if (blocked) unavailable.add(current);
    current = nextDate(current);
  }

  // Group consecutive dates into ranges, so a 5-night reservation is one
  // event, not five — matches how the source feeds already do it.
  const sorted = Array.from(unavailable).sort();
  const ranges: { start: string; end: string }[] = [];
  for (const date of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && last.end === date) {
      last.end = nextDate(date);
    } else {
      ranges.push({ start: date, end: nextDate(date) });
    }
  }

  const calendar = ical({
    name: property.name,
    method: ICalCalendarMethod.PUBLISH,
  });

  for (const range of ranges) {
    calendar.createEvent({
      start: new Date(range.start),
      end: new Date(range.end),
      allDay: true,
      summary: "No disponible",
    });
  }

  return new NextResponse(calendar.toString(), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
}
