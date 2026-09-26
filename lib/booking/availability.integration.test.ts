import { getStayAvailability, getPropertyAvailabilityDays } from "@/lib/booking/availability";
import {
  createTestProperty,
  createTestCalendarDay,
  createTestReservation,
  cleanup,
} from "@/lib/testUtils/db";

afterEach(async () => {
  await cleanup();
});

describe("getStayAvailability", () => {
  it("is available with correct total price when nothing blocks it", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });

    const result = await getStayAvailability(
      propertyId,
      "2027-01-10",
      "2027-01-13", // exclusive checkout -> 3 nights
    );

    expect(result.available).toBe(true);
    expect(result.nights).toBe(3);
    expect(result.totalPrice).toBe(300);
    expect(result.blockingDate).toBeNull();
  });

  it("is unavailable when an active pending reservation overlaps", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    await createTestReservation(propertyId, "2027-01-10", "2027-01-13", {
      status: "pending",
    });

    const result = await getStayAvailability(
      propertyId,
      "2027-01-11",
      "2027-01-14",
    );

    expect(result.available).toBe(false);
    expect(result.blockingDate).toBe("2027-01-11");
    expect(result.totalPrice).toBe(0);
    expect(result.nights).toBe(0);
  });

  it("is available when the overlapping reservation is cancelled", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    await createTestReservation(propertyId, "2027-01-10", "2027-01-13", {
      status: "cancelled",
    });

    const result = await getStayAvailability(
      propertyId,
      "2027-01-10",
      "2027-01-13",
    );

    expect(result.available).toBe(true);
  });

  it("stops at a calendar_days blocked override and prices only the nights before it", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    await createTestCalendarDay(propertyId, "2027-01-12", {
      status: "blocked",
    });

    const result = await getStayAvailability(
      propertyId,
      "2027-01-10",
      "2027-01-15",
    );

    expect(result.available).toBe(false);
    expect(result.blockingDate).toBe("2027-01-12");
    // Priced 2027-01-10 and 2027-01-11 only, before the block.
    expect(result.nights).toBe(2);
    expect(result.totalPrice).toBe(200);
  });

  it("uses per-day calendar_days price overrides in the total", async () => {
    const propertyId = await createTestProperty({ default_price: 100 });
    await createTestCalendarDay(propertyId, "2027-01-11", {
      status: "available",
      price: 150,
    });

    const result = await getStayAvailability(
      propertyId,
      "2027-01-10",
      "2027-01-13", // nights: 10 (100), 11 (150 override), 12 (100)
    );

    expect(result.available).toBe(true);
    expect(result.nights).toBe(3);
    expect(result.totalPrice).toBe(350);
  });

  it("anchors requiredMinStay to the check-in date's override, not the property default", async () => {
    const propertyId = await createTestProperty({
      default_price: 100,
      default_min_stay: 1,
    });
    await createTestCalendarDay(propertyId, "2027-01-10", {
      status: "available",
      min_stay: 3,
    });

    const tooShort = await getStayAvailability(
      propertyId,
      "2027-01-10",
      "2027-01-12", // 2 nights
    );
    expect(tooShort.requiredMinStay).toBe(3);
    expect(tooShort.minStayOk).toBe(false);

    const longEnough = await getStayAvailability(
      propertyId,
      "2027-01-10",
      "2027-01-13", // 3 nights
    );
    expect(longEnough.requiredMinStay).toBe(3);
    expect(longEnough.minStayOk).toBe(true);
  });
});

describe("getPropertyAvailabilityDays", () => {
    it("returns one entry per day, inclusive of both start and end", async () => {
      const propertyId = await createTestProperty({ default_price: 100 });
  
      const days = await getPropertyAvailabilityDays(
        propertyId,
        "2027-02-01",
        "2027-02-03",
      );
  
      expect(days.map((d) => d.date)).toEqual([
        "2027-02-01",
        "2027-02-02",
        "2027-02-03",
      ]);
      expect(days.every((d) => d.available)).toBe(true);
      expect(days.every((d) => d.reserved === false)).toBe(true);
      expect(days.every((d) => d.price === 100)).toBe(true);
    });
  
    it("marks days covered by an active reservation as unavailable and reserved", async () => {
      const propertyId = await createTestProperty({ default_price: 100 });
      await createTestReservation(propertyId, "2027-02-02", "2027-02-04", {
        status: "confirmed",
      });
  
      const days = await getPropertyAvailabilityDays(
        propertyId,
        "2027-02-01",
        "2027-02-04",
      );
  
      const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
  
      expect(byDate["2027-02-01"].available).toBe(true);
      expect(byDate["2027-02-01"].reserved).toBe(false);
  
      // end_date is exclusive at the DB/reservation level, so 02-02 and
      // 02-03 are reserved but 02-04 (checkout day) is not.
      expect(byDate["2027-02-02"].available).toBe(false);
      expect(byDate["2027-02-02"].reserved).toBe(true);
      expect(byDate["2027-02-03"].available).toBe(false);
      expect(byDate["2027-02-03"].reserved).toBe(true);
      expect(byDate["2027-02-04"].available).toBe(true);
      expect(byDate["2027-02-04"].reserved).toBe(false);
    });
  
    it("marks a blocked override day unavailable, with no reservation involved", async () => {
      const propertyId = await createTestProperty({ default_price: 100 });
      await createTestCalendarDay(propertyId, "2027-02-05", {
        status: "blocked",
      });
  
      const days = await getPropertyAvailabilityDays(
        propertyId,
        "2027-02-04",
        "2027-02-06",
      );
      const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
  
      expect(byDate["2027-02-05"].available).toBe(false);
      expect(byDate["2027-02-05"].reserved).toBe(false);
    });
  
    it("a reservation cannot be overridden back to available by a forced-open calendar_days row", async () => {
      const propertyId = await createTestProperty({ default_price: 100 });
      await createTestReservation(propertyId, "2027-02-10", "2027-02-12", {
        status: "pending",
      });
      // Force-open override on a date that's actually reserved internally.
      await createTestCalendarDay(propertyId, "2027-02-10", {
        status: "available",
      });
  
      const days = await getPropertyAvailabilityDays(
        propertyId,
        "2027-02-10",
        "2027-02-10",
      );
  
      expect(days[0].available).toBe(false);
      expect(days[0].reserved).toBe(true);
    });
  
    it("falls back to the property's default price and min stay when no override exists", async () => {
      const propertyId = await createTestProperty({
        default_price: 120,
        default_min_stay: 2,
      });
  
      const days = await getPropertyAvailabilityDays(
        propertyId,
        "2027-02-20",
        "2027-02-20",
      );
  
      expect(days[0].price).toBe(120);
      expect(days[0].minStay).toBe(2);
    });
  });
