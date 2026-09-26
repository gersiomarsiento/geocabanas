import icalParser from "node-ical";
import { GET } from "@/app/api/ical/[slug]/route";
import {
  createTestProperty,
  createTestCalendarDay,
  createTestReservation,
  cleanup,
  uniqueSlug,
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

      return realFetch(input, init);
    },
  ) as unknown as typeof fetch;
}

function callRoute(slug: string) {
  return GET(new Request(`http://localhost/api/ical/${slug}`), {
    params: Promise.resolve({ slug }),
  });
}

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
    const slug = uniqueSlug("ical-empty");
    await createTestProperty({ slug });

    const res = await callRoute(slug);
    const text = await res.text();

    expect(res.headers.get("Content-Type")).toBe(
      "text/calendar; charset=utf-8",
    );
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(parseUnavailableRanges(text)).toEqual([]);
  });

  it("includes one event for a single blocked calendar_days entry", async () => {
    const slug = uniqueSlug("ical-blocked");
    const propertyId = await createTestProperty({ slug });
    await createTestCalendarDay(propertyId, "2027-06-15", {
      status: "blocked",
    });

    const res = await callRoute(slug);
    const ranges = parseUnavailableRanges(await res.text());

    expect(ranges).toEqual([{ start: "2027-06-15", end: "2027-06-16" }]);
  });

  it("merges consecutive blocked days into a single event, not one per day", async () => {
    const slug = uniqueSlug("ical-consecutive");
    const propertyId = await createTestProperty({ slug });
    await createTestCalendarDay(propertyId, "2027-06-20", {
      status: "blocked",
    });
    await createTestCalendarDay(propertyId, "2027-06-21", {
      status: "blocked",
    });
    await createTestCalendarDay(propertyId, "2027-06-22", {
      status: "blocked",
    });

    const res = await callRoute(slug);
    const ranges = parseUnavailableRanges(await res.text());

    expect(ranges).toEqual([{ start: "2027-06-20", end: "2027-06-23" }]);
  });

  it("includes an event for an active reservation's date range", async () => {
    const slug = uniqueSlug("ical-reserved");
    const propertyId = await createTestProperty({ slug });
    await createTestReservation(propertyId, "2027-07-01", "2027-07-04", {
      status: "confirmed",
    });

    const res = await callRoute(slug);
    const ranges = parseUnavailableRanges(await res.text());

    expect(ranges).toEqual([{ start: "2027-07-01", end: "2027-07-04" }]);
  });

  it("includes dates blocked by the external iCal feed", async () => {
    const slug = uniqueSlug("ical-external");
    await createTestProperty({
      slug,
      external_ical_url: "https://example.com/feed.ics",
    });
    mockIcalFetch(
      "https://example.com/feed.ics",
      icsWithEvent("20270801", "20270805"),
    );

    const res = await callRoute(slug);
    const ranges = parseUnavailableRanges(await res.text());

    expect(ranges).toEqual([{ start: "2027-08-01", end: "2027-08-05" }]);
  });

  it("excludes a date force-opened by a calendar_days override, even though the external feed blocks it", async () => {
    const slug = uniqueSlug("ical-forced-open");
    const propertyId = await createTestProperty({
      slug,
      external_ical_url: "https://example.com/feed.ics",
    });
    await createTestCalendarDay(propertyId, "2027-08-12", {
      status: "available",
    });
    mockIcalFetch(
      "https://example.com/feed.ics",
      icsWithEvent("20270810", "20270815"),
    );

    const res = await callRoute(slug);
    const ranges = parseUnavailableRanges(await res.text());

    expect(ranges).toEqual([
      { start: "2027-08-10", end: "2027-08-12" },
      { start: "2027-08-13", end: "2027-08-15" },
    ]);
  });
});
