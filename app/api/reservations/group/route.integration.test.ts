jest.mock("@/lib/email/resend", () => ({
  resend: { emails: { send: jest.fn().mockResolvedValue({ id: "mock" }) } },
  FROM_ADDRESS: "Test <test@example.com>",
  ADMIN_EMAIL: "admin@example.com",
}));

import { POST } from "@/app/api/reservations/group/route";
import { resend } from "@/lib/email/resend";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createTestProperty,
  createTestCalendarDay,
  cleanup,
} from "@/lib/testUtils/db";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/reservations/group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validGuest = {
  guestName: "Ana Test",
  guestEmail: "ana@example.com",
  guestPhone: "099123456",
};

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

describe("POST /api/reservations/group — validation", () => {
  it("returns 400 when legs or guest fields are missing", async () => {
    const res = await POST(postRequest({ ...validGuest }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when one of the leg properties doesn't exist", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });

    const res = await POST(
      postRequest({
        legs: [
          { propertyId, startDate: "2027-09-01", endDate: "2027-09-03" },
          {
            propertyId: "00000000-0000-0000-0000-000000000000",
            startDate: "2027-09-01",
            endDate: "2027-09-03",
          },
        ],
        ...validGuest,
      }),
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/reservations/group — availability re-check", () => {
  it("returns 409 when one leg's dates are blocked", async () => {
    const propertyA = await createTestProperty({ default_price: 100 });
    const propertyB = await createTestProperty({ default_price: 100 });
    await createTestCalendarDay(propertyB, "2027-09-11", {
      status: "blocked",
    });

    const res = await POST(
      postRequest({
        legs: [
          {
            propertyId: propertyA,
            startDate: "2027-09-10",
            endDate: "2027-09-13",
          },
          {
            propertyId: propertyB,
            startDate: "2027-09-10",
            endDate: "2027-09-13",
          },
        ],
        ...validGuest,
      }),
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 (fixed — was 409) when one leg fails min-stay", async () => {
    const propertyA = await createTestProperty({ default_price: 100 });
    const propertyB = await createTestProperty({ default_price: 100 });
    await createTestCalendarDay(propertyB, "2027-09-20", {
      status: "available",
      min_stay: 5,
    });

    const res = await POST(
      postRequest({
        legs: [
          {
            propertyId: propertyA,
            startDate: "2027-09-20",
            endDate: "2027-09-22",
          },
          {
            propertyId: propertyB,
            startDate: "2027-09-20",
            endDate: "2027-09-22",
          }, // 2 nights, needs 5
        ],
        ...validGuest,
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/reservations/group — success path", () => {
  it("creates one reservation per leg with correct summed pricing and per-leg emails", async () => {
    const propertyA = await createTestProperty({
      default_price: 100,
      deposit_percentage: 50,
    });
    const propertyB = await createTestProperty({
      default_price: 80,
      deposit_percentage: 25,
    });

    const res = await POST(
      postRequest({
        legs: [
          {
            propertyId: propertyA,
            startDate: "2027-10-01",
            endDate: "2027-10-04",
          }, // 3 nights * 100 = 300, deposit 150
          {
            propertyId: propertyB,
            startDate: "2027-10-01",
            endDate: "2027-10-03",
          }, // 2 nights * 80 = 160, deposit 40
        ],
        ...validGuest,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.reservationIds).toHaveLength(2);
    expect(body.totalPrice).toBe(460);
    expect(body.depositAmount).toBe(190);

    const { data: rows } = await supabaseAdmin
      .from("reservations")
      .select("property_id, status")
      .in("id", body.reservationIds);

    expect(rows).toHaveLength(2);
    expect(rows?.every((r) => r.status === "pending")).toBe(true);

    // 2 legs * 2 emails (guest + admin) each.
    expect(resend.emails.send).toHaveBeenCalledTimes(4);
  });
});

describe("POST /api/reservations/group — atomicity under a real race", () => {
  it("rolls back a losing request's OTHER leg too, not just the colliding one", async () => {
    const propertyA1 = await createTestProperty({ default_price: 100 });
    const propertyA2 = await createTestProperty({ default_price: 100 });
    const sharedPropertyB = await createTestProperty({ default_price: 100 });

    const sharedDates = { startDate: "2027-11-01", endDate: "2027-11-04" };

    const requestX = {
      legs: [
        { propertyId: propertyA1, ...sharedDates },
        { propertyId: sharedPropertyB, ...sharedDates },
      ],
      ...validGuest,
    };
    const requestY = {
      legs: [
        { propertyId: propertyA2, ...sharedDates },
        { propertyId: sharedPropertyB, ...sharedDates },
      ],
      guestName: "Otro Guest",
      guestEmail: "otro@example.com",
      guestPhone: "099999999",
    };

    // Both pass the pre-check (neither request's rows are committed yet),
    // so only the DB exclusion constraint on sharedPropertyB can decide
    // the winner. The real question: does the LOSING request's OTHER
    // leg (propertyA1 or propertyA2) also get rolled back?
    const [resX, resY] = await Promise.all([
      POST(postRequest(requestX)),
      POST(postRequest(requestY)),
    ]);

    const statuses = [resX.status, resY.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winnerIsX = resX.status === 200;
    const losingSoloPropertyId = winnerIsX ? propertyA2 : propertyA1;

    const { data: leftoverRows } = await supabaseAdmin
      .from("reservations")
      .select("id")
      .eq("property_id", losingSoloPropertyId);

    // If atomicity holds, the losing request's solo-property leg was
    // never left behind — the whole group insert rolled back together.
    expect(leftoverRows).toHaveLength(0);

    const { data: sharedRows } = await supabaseAdmin
      .from("reservations")
      .select("id")
      .eq("property_id", sharedPropertyB);

    // Only the winner's leg on the shared property should exist.
    expect(sharedRows).toHaveLength(1);
  });
});
