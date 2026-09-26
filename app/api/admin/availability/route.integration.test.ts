import { GET, PATCH } from "@/app/api/admin/availability/route";
import { getPropertyAvailabilityDays } from "@/lib/booking/availability";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createTestProperty,
  createTestCalendarDay,
  createTestReservation,
  cleanup,
} from "@/lib/testUtils/db";
import { mockUrlFetch, restoreFetch } from "@/lib/testUtils/mockFetch";

function getRequest(query: string): Request {
  return new Request(`http://localhost/api/admin/availability${query}`);
}

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/availability", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

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

afterEach(async () => {
  await cleanup();
  restoreFetch();
});

describe("GET /api/admin/availability", () => {
  it("returns 400 when params are missing", async () => {
    const res = await GET(getRequest("?propertyId=x&year=2027"));
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown property", async () => {
    const res = await GET(
      getRequest(
        "?propertyId=00000000-0000-0000-0000-000000000000&year=2027&month=11",
      ),
    );
    expect(res.status).toBe(404);
  });

  it("returns the full month's days, correct count for November (30 days)", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    const res = await GET(
      getRequest(`?propertyId=${propertyId}&year=2027&month=11`),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.days).toHaveLength(30);
    expect(body.days[0].date).toBe("2027-11-01");
    expect(body.days[29].date).toBe("2027-11-30");
  });

  it("returns the correct count for February in a leap year (2028: 29 days)", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    const res = await GET(
      getRequest(`?propertyId=${propertyId}&year=2028&month=2`),
    );
    const body = await res.json();
    expect(body.days).toHaveLength(29);
  });
});

describe("PATCH /api/admin/availability — validation", () => {
  it("returns 400 when required params are missing", async () => {
    const res = await PATCH(patchRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown property", async () => {
    const res = await PATCH(
      patchRequest({
        propertyId: "00000000-0000-0000-0000-000000000000",
        startDate: "2027-11-01",
        endDate: "2027-11-05",
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when startDate is after endDate", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    const res = await PATCH(
      patchRequest({
        propertyId,
        startDate: "2027-11-10",
        endDate: "2027-11-05",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("allows startDate === endDate (single-day range)", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    const res = await PATCH(
      patchRequest({
        propertyId,
        startDate: "2027-11-10",
        endDate: "2027-11-10",
        available: false,
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.updatedDates).toEqual(["2027-11-10"]);
  });
});

describe("PATCH /api/admin/availability — reservation conflicts", () => {
  it("skips a reserved date (and nothing else in the day) when 'available' is requested, reporting it in skippedDates", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    await createTestReservation(propertyId, "2027-11-15", "2027-11-17", {
      status: "confirmed",
    });

    const res = await PATCH(
      patchRequest({
        propertyId,
        startDate: "2027-11-14",
        endDate: "2027-11-16",
        available: false,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.updatedDates).toEqual(["2027-11-14"]);
    // The reservation runs 11-15 through 11-17 (exclusive checkout), so
    // both the 15th and 16th are occupied nights — both get skipped.
    expect(body.skippedDates).toHaveLength(2);
    expect(body.skippedDates.map((s: { date: string }) => s.date)).toEqual([
      "2027-11-15",
      "2027-11-16",
    ]);
    expect(body.skippedDates[0].reservation.status).toBe("confirmed");

    const { data: row } = await supabaseAdmin
      .from("calendar_days")
      .select("id")
      .eq("property_id", propertyId)
      .eq("date", "2027-11-15")
      .maybeSingle();
    expect(row).toBeNull();
  });

  it("does NOT skip a reserved date for a price-only update (no 'available' field)", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    await createTestReservation(propertyId, "2027-11-20", "2027-11-22", {
      status: "pending",
    });

    const res = await PATCH(
      patchRequest({
        propertyId,
        startDate: "2027-11-20",
        endDate: "2027-11-20",
        price: 150,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.skippedDates).toEqual([]);
    expect(body.updatedDates).toEqual(["2027-11-20"]);

    const { data: row } = await supabaseAdmin
      .from("calendar_days")
      .select("price")
      .eq("property_id", propertyId)
      .eq("date", "2027-11-20")
      .single();
    expect(Number(row?.price)).toBe(150);
  });
});

describe("PATCH /api/admin/availability — iCal conflicts", () => {
  it("blocks ANY field change on an iCal-conflicted date without confirmIcalOverride, even a price-only edit", async () => {
    const propertyId = await createTestProperty({
      default_price: 100,
      external_ical_url: "https://example.com/feed.ics",
    });
    mockUrlFetch(
      "https://example.com/feed.ics",
      icsWithEvent("20271201", "20271205"),
    );

    const res = await PATCH(
      patchRequest({
        propertyId,
        startDate: "2027-12-02",
        endDate: "2027-12-02",
        price: 200, // price-only, no 'available' field
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.icalConflictDates).toEqual(["2027-12-02"]);
    expect(body.updatedDates).toEqual([]);
  });

  it("proceeds when confirmIcalOverride is true", async () => {
    const propertyId = await createTestProperty({
      default_price: 100,
      external_ical_url: "https://example.com/feed2.ics",
    });
    mockUrlFetch(
      "https://example.com/feed2.ics",
      icsWithEvent("20271210", "20271215"),
    );

    const res = await PATCH(
      patchRequest({
        propertyId,
        startDate: "2027-12-11",
        endDate: "2027-12-11",
        price: 200,
        confirmIcalOverride: true,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.icalConflictDates).toEqual([]);
    expect(body.updatedDates).toEqual(["2027-12-11"]);
  });
});

describe("PATCH /api/admin/availability — insert vs update, partial fields", () => {
  it("inserts a new calendar_days row when none exists", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });

    await PATCH(
      patchRequest({
        propertyId,
        startDate: "2028-01-05",
        endDate: "2028-01-05",
        available: false,
        price: 175,
        minStay: 3,
      }),
    );

    const { data: row } = await supabaseAdmin
      .from("calendar_days")
      .select("status, price, min_stay")
      .eq("property_id", propertyId)
      .eq("date", "2028-01-05")
      .single();

    expect(row?.status).toBe("blocked");
    expect(Number(row?.price)).toBe(175);
    expect(row?.min_stay).toBe(3);
  });

  it("updates only the provided fields, leaving others untouched", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    await createTestCalendarDay(propertyId, "2028-01-10", {
      status: "blocked",
      price: 90,
      min_stay: 2,
    });

    // Only touch price this time.
    await PATCH(
      patchRequest({
        propertyId,
        startDate: "2028-01-10",
        endDate: "2028-01-10",
        price: 120,
      }),
    );

    const { data: row } = await supabaseAdmin
      .from("calendar_days")
      .select("status, price, min_stay")
      .eq("property_id", propertyId)
      .eq("date", "2028-01-10")
      .single();

    expect(row?.status).toBe("blocked"); // untouched
    expect(Number(row?.price)).toBe(120); // updated
    expect(row?.min_stay).toBe(2); // untouched
  });
});

describe("PATCH /api/admin/availability — DB error resilience", () => {
  it("reports a failed date in failedDates rather than crashing, on a genuine DB error", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });

    const res = await PATCH(
      patchRequest({
        propertyId,
        startDate: "2028-02-01",
        endDate: "2028-02-01",
        price: "not-a-number", // numeric column, should fail at the DB
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.failedDates).toHaveLength(1);
    expect(body.failedDates[0].date).toBe("2028-02-01");
    expect(body.updatedDates).toEqual([]);
  });
});

describe("PATCH /api/admin/availability — end-to-end with availability logic", () => {
  it("a PATCH block is reflected by getPropertyAvailabilityDays", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });

    await PATCH(
      patchRequest({
        propertyId,
        startDate: "2028-03-01",
        endDate: "2028-03-01",
        available: false,
      }),
    );

    const days = await getPropertyAvailabilityDays(
      propertyId,
      "2028-03-01",
      "2028-03-01",
    );
    expect(days[0].available).toBe(false);
  });
});
