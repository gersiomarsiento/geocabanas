import icalParser from "node-ical";
import { GET } from "@/app/api/ical/[slug]/route";
import {
  createTestProperty,
  createTestCalendarDay,
  createTestReservation,
  cleanup,
} from "@/lib/testUtils/db";

function icsWithEvent(start: string, end: string): string {
  return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:1@test
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${end}
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR`;
}

const realFetch = global.fetch;

function mockIcalFetch(icalUrl: string, body: string) {
  global.fetch = jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url === icalUrl) {
        return {
          ok: true,
          status: 200,
          text: async () => body,
        } as Response;
      }

      // Anything else (Supabase's own REST calls) goes to the real fetch.
      return realFetch(input, init);
    },
  ) as unknown as typeof fetch;
}

function callRoute(slug: string) {
  return GET(new Request(`http://localhost/api/ical/${slug}`), {
    params: Promise.resolve({ slug }),
  });
}

// Parses the route's actual ICS output back into a sorted list of
// {start, end} ISO-date ranges, via the same real parser the project
// uses elsewhere -- avoids asserting against a brittle exact string.
function parseUnavailableRanges(
  text: string,
): { start: string; end: string }[] {
  const parsed = icalParser.parseICS(text);
  const ranges: { start: string; end: string }[] = [];

  for (const key in parsed) {
    const event = parsed[key];
    if (!event || event.type !== "VEVENT") continue;
    ranges.push({
      start: (event.start as Date).toISOString().slice(0, 10),
      end: (event.end as Date).toISOString().slice(0, 10),
    });
  }

  return ranges.sort((a, b) => a.start.localeCompare(b.start));
}

afterEach(async () => {
  await cleanup();
  global.fetch = realFetch;
});

describe("GET /api/ical/[slug]", () => {
  it("returns 404 for an unknown slug", async () => {
    const res = await callRoute("does-not-exist");
    expect(res.status).toBe(404);
  });

  it("returns a valid empty calendar when nothing is blocked", async () => {
    await createTestProperty({ slug: "ical-empty" });

    const res = await callRoute("ical-empty");
    const text = await res.text();

    expect(res.headers.get("Content-Type")).toBe(
      "text/calendar; charset=utf-8",
    );
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(parseUnavailableRanges(text)).toEqual([]);
  });

  it("includes one event for a single blocked calendar_days entry", async () => {
    const propertyId = await createTestProperty({ slug: "ical-blocked" });
    await createTestCalendarDay(propertyId, "2027-06-15", {
      status: "blocked",
    });

    const res = await callRoute("ical-blocked");
    const ranges = parseUnavailableRanges(await res.text());

    expect(ranges).toEqual([{ start: "2027-06-15", end: "2027-06-16" }]);
  });

  it("merges consecutive blocked days into a single event, not one per day", async () => {
    const propertyId = await createTestProperty({ slug: "ical-consecutive" });
    await createTestCalendarDay(propertyId, "2027-06-20", {
      status: "blocked",
    });
    await createTestCalendarDay(propertyId, "2027-06-21", {
      status: "blocked",
    });
    await createTestCalendarDay(propertyId, "2027-06-22", {
      status: "blocked",
    });

    const res = await callRoute("ical-consecutive");
    const ranges = parseUnavailableRanges(await res.text());

    expect(ranges).toEqual([{ start: "2027-06-20", end: "2027-06-23" }]);
  });

  it("includes an event for an active reservation's date range", async () => {
    const propertyId = await createTestProperty({ slug: "ical-reserved" });
    await createTestReservation(propertyId, "2027-07-01", "2027-07-04", {
      status: "confirmed",
    });

    const res = await callRoute("ical-reserved");
    const ranges = parseUnavailableRanges(await res.text());

    expect(ranges).toEqual([{ start: "2027-07-01", end: "2027-07-04" }]);
  });

  it("includes dates blocked by the external iCal feed", async () => {
    await createTestProperty({
      slug: "ical-external",
      external_ical_url: "https://example.com/feed.ics",
    });
    mockIcalFetch("https://example.com/feed.ics", icsWithEvent("20270801", "20270805"));

    const res = await callRoute("ical-external");
    const ranges = parseUnavailableRanges(await res.text());

    expect(ranges).toEqual([{ start: "2027-08-01", end: "2027-08-05" }]);
  });

  it("excludes a date force-opened by a calendar_days override, even though the external feed blocks it", async () => {
    const propertyId = await createTestProperty({
      slug: "ical-forced-open",
      external_ical_url: "https://example.com/feed.ics",
    });
    await createTestCalendarDay(propertyId, "2027-08-12", {
      status: "available",
    });
    mockIcalFetch("https://example.com/feed.ics", icsWithEvent("20270810", "20270815"));

    const res = await callRoute("ical-forced-open");
    const ranges = parseUnavailableRanges(await res.text());

    // 08-12 should be carved out, splitting the feed's range into two.
    expect(ranges).toEqual([
      { start: "2027-08-10", end: "2027-08-12" },
      { start: "2027-08-13", end: "2027-08-15" },
    ]);
  });
});
