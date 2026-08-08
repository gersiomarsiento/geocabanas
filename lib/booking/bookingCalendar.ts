// Fetches your Booking.com iCal export feed and converts it into a simple
// list of booked date ranges. Server-side only.
import ical from "node-ical";

export interface BookedRange {
  start: string; // ISO date, e.g. "2026-08-10"
  end: string; // ISO date (checkout day — treated as exclusive)
}

export async function getBookedRanges(icalUrl: string): Promise<BookedRange[]> {
  if (!icalUrl) {
    throw new Error("No booking_ical_url provided for this property");
  }

  const res = await fetch(icalUrl, {
    next: { revalidate: 3600 }, // cache 1hr — Booking.com's own feed lags anyway
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch iCal feed: ${res.status}`);
  }

  const raw = await res.text();
  const parsed = ical.parseICS(raw);

  const ranges: BookedRange[] = [];

  for (const key in parsed) {
    const event = parsed[key];

    if (event.type !== "VEVENT" || !event.start || !event.end) continue;

    ranges.push({
      start: toISODate(event.start as Date),
      end: toISODate(event.end as Date),
    });
  }

  return mergeRanges(ranges);
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mergeRanges(ranges: BookedRange[]): BookedRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
  const merged: BookedRange[] = [sorted[0]];

  for (const current of sorted.slice(1)) {
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      last.end = current.end > last.end ? current.end : last.end;
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}
