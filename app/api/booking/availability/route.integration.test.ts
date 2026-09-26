import { NextRequest } from "next/server";
import { GET } from "@/app/api/booking/availability/route";
import {
  createTestProperty,
  createTestCalendarDay,
  cleanup,
} from "@/lib/testUtils/db";

function requestFor(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/booking/availability${query}`);
}

afterEach(async () => {
  await cleanup();
});

describe("GET /api/booking/availability", () => {
  it("returns 404 when the slug matches no property", async () => {
    const res = await GET(requestFor("?property=does-not-exist"));
    expect(res.status).toBe(404);
  });

  it("returns the property and a default 365-day-ahead (366-entry, inclusive) day list", async () => {
    await createTestProperty({
      slug: "route-test-default-days",
      default_price: 100,
    });

    const res = await GET(requestFor("?property=route-test-default-days"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.property.slug).toBe("route-test-default-days");
    expect(body.days).toHaveLength(366);
    expect(body.days[0].price).toBe(100);
  });

  it("respects a custom days param", async () => {
    await createTestProperty({
      slug: "route-test-custom-days",
      default_price: 100,
    });

    const res = await GET(
      requestFor("?property=route-test-custom-days&days=5"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.days).toHaveLength(6); // inclusive of both endpoints
  });

  it("returns 502 when the days param is non-numeric", async () => {
    await createTestProperty({
      slug: "route-test-bad-days",
      default_price: 100,
    });

    const res = await GET(
      requestFor("?property=route-test-bad-days&days=not-a-number"),
    );

    expect(res.status).toBe(502);
  });

  it("reflects a calendar_days block through the full route -> DB chain", async () => {
    const propertyId = await createTestProperty({
      slug: "route-test-blocked-day",
      default_price: 100,
    });

    const today = new Date();
    const blockedDate = new Date(today);
    blockedDate.setDate(blockedDate.getDate() + 2);
    const blockedDateStr = blockedDate.toISOString().slice(0, 10);

    await createTestCalendarDay(propertyId, blockedDateStr, {
      status: "blocked",
    });

    const res = await GET(
      requestFor("?property=route-test-blocked-day&days=10"),
    );
    const body = await res.json();

    const blockedEntry = body.days.find(
      (d: { date: string }) => d.date === blockedDateStr,
    );
    expect(blockedEntry.available).toBe(false);
  });
});
