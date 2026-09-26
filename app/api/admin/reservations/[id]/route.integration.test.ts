import { PATCH } from "@/app/api/admin/reservations/[id]/route";
import { getStayAvailability } from "@/lib/booking/availability";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createTestProperty,
  createTestReservation,
  cleanup,
} from "@/lib/testUtils/db";

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/reservations/x", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function callRoute(id: string, body: unknown) {
  return PATCH(patchRequest(body), { params: Promise.resolve({ id }) });
}

afterEach(async () => {
  await cleanup();
});

describe("PATCH /api/admin/reservations/[id] — validation", () => {
  it("rejects a status other than 'cancelled'", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    const reservationId = await createTestReservation(
      propertyId,
      "2027-12-01",
      "2027-12-03",
    );

    const res = await callRoute(reservationId, { status: "confirmed" });
    expect(res.status).toBe(400);
  });

  it("rejects a missing/malformed body without crashing", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    const reservationId = await createTestReservation(
      propertyId,
      "2027-12-01",
      "2027-12-03",
    );

    const malformedReq = new Request(
      "http://localhost/api/admin/reservations/x",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "not valid json",
      },
    );
    const res = await PATCH(malformedReq, {
      params: Promise.resolve({ id: reservationId }),
    });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/admin/reservations/[id] — unknown id", () => {
  it("returns 404 for an id that doesn't exist (fixed — was 500)", async () => {
    const res = await callRoute("00000000-0000-0000-0000-000000000000", {
      status: "cancelled",
    });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/admin/reservations/[id] — success", () => {
  it("cancels a pending reservation and persists it in the DB", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    const reservationId = await createTestReservation(
      propertyId,
      "2027-12-10",
      "2027-12-13",
      { status: "pending" },
    );

    const res = await callRoute(reservationId, { status: "cancelled" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.reservation.status).toBe("cancelled");

    const { data: row } = await supabaseAdmin
      .from("reservations")
      .select("status")
      .eq("id", reservationId)
      .single();
    expect(row?.status).toBe("cancelled");
  });

  it("is idempotent — cancelling an already-cancelled reservation still succeeds", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    const reservationId = await createTestReservation(
      propertyId,
      "2027-12-15",
      "2027-12-17",
      { status: "cancelled" },
    );

    const res = await callRoute(reservationId, { status: "cancelled" });
    expect(res.status).toBe(200);
  });

  it("end-to-end: cancelling actually frees the dates for a new booking", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    const reservationId = await createTestReservation(
      propertyId,
      "2027-12-20",
      "2027-12-23",
      { status: "pending" },
    );

    const before = await getStayAvailability(
      propertyId,
      "2027-12-20",
      "2027-12-23",
    );
    expect(before.available).toBe(false);

    await callRoute(reservationId, { status: "cancelled" });

    const after = await getStayAvailability(
      propertyId,
      "2027-12-20",
      "2027-12-23",
    );
    expect(after.available).toBe(true);
  });
});
