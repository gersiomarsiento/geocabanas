import { getBookedRanges } from "@/lib/booking/bookingCalendar";

function mockFetchOnce(options: {
  ok: boolean;
  status?: number;
  body?: string;
}) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: options.ok,
    status: options.status ?? 200,
    text: async () => options.body ?? "",
  }) as unknown as typeof fetch;
}

function icsWithEvents(events: { start: string; end: string }[]): string {
  const veventBlocks = events
    .map(
      (e, i) => `BEGIN:VEVENT
UID:${i}@test
DTSTART;VALUE=DATE:${e.start}
DTEND;VALUE=DATE:${e.end}
SUMMARY:Reserved
END:VEVENT`,
    )
    .join("\n");

  return `BEGIN:VCALENDAR
VERSION:2.0
${veventBlocks}
END:VCALENDAR`;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getBookedRanges", () => {
  it("throws without calling fetch when icalUrl is empty", async () => {
    global.fetch = jest.fn();
    await expect(getBookedRanges("")).rejects.toThrow(
      "No external_ical_url provided for this property",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("throws when the fetch response is not ok", async () => {
    mockFetchOnce({ ok: false, status: 404 });
    await expect(
      getBookedRanges("https://example.com/feed.ics"),
    ).rejects.toThrow("Failed to fetch iCal feed: 404");
  });

  it("parses a single VEVENT into a booked range", async () => {
    mockFetchOnce({
      ok: true,
      body: icsWithEvents([{ start: "20270301", end: "20270305" }]),
    });

    const ranges = await getBookedRanges("https://example.com/feed.ics");

    expect(ranges).toEqual([{ start: "2027-03-01", end: "2027-03-05" }]);
  });

  it("merges overlapping ranges into one", async () => {
    mockFetchOnce({
      ok: true,
      body: icsWithEvents([
        { start: "20270301", end: "20270305" },
        { start: "20270304", end: "20270308" },
      ]),
    });

    const ranges = await getBookedRanges("https://example.com/feed.ics");

    expect(ranges).toEqual([{ start: "2027-03-01", end: "2027-03-08" }]);
  });

  it("merges adjacent (touching) ranges into one", async () => {
    mockFetchOnce({
      ok: true,
      body: icsWithEvents([
        { start: "20270301", end: "20270305" },
        { start: "20270305", end: "20270310" },
      ]),
    });

    const ranges = await getBookedRanges("https://example.com/feed.ics");

    expect(ranges).toEqual([{ start: "2027-03-01", end: "2027-03-10" }]);
  });

  it("keeps non-overlapping ranges separate", async () => {
    mockFetchOnce({
      ok: true,
      body: icsWithEvents([
        { start: "20270301", end: "20270303" },
        { start: "20270310", end: "20270312" },
      ]),
    });

    const ranges = await getBookedRanges("https://example.com/feed.ics");

    expect(ranges).toEqual([
      { start: "2027-03-01", end: "2027-03-03" },
      { start: "2027-03-10", end: "2027-03-12" },
    ]);
  });

  it("returns an empty array when the feed has no events", async () => {
    mockFetchOnce({
      ok: true,
      body: `BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR`,
    });

    const ranges = await getBookedRanges("https://example.com/feed.ics");

    expect(ranges).toEqual([]);
  });
});
