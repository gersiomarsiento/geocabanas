import { nextDate, expandRangesToDateSet } from "@/lib/calendar/dates";

describe("nextDate", () => {
  it("increments a plain day", () => {
    expect(nextDate("2027-01-10")).toBe("2027-01-11");
  });

  it("rolls over to the next month", () => {
    expect(nextDate("2027-01-31")).toBe("2027-02-01");
  });

  it("rolls over to the next year", () => {
    expect(nextDate("2027-12-31")).toBe("2028-01-01");
  });

  it("handles Feb 28 -> Feb 29 in a leap year", () => {
    expect(nextDate("2028-02-28")).toBe("2028-02-29");
  });

  it("handles Feb 29 -> Mar 1 in a leap year", () => {
    expect(nextDate("2028-02-29")).toBe("2028-03-01");
  });

  it("handles Feb 28 -> Mar 1 in a non-leap year", () => {
    expect(nextDate("2027-02-28")).toBe("2027-03-01");
  });
});

describe("expandRangesToDateSet", () => {
  it("expands a single range with end treated as exclusive checkout", () => {
    const set = expandRangesToDateSet([
      { start: "2027-03-10", end: "2027-03-13" },
    ]);
    expect([...set].sort()).toEqual(["2027-03-10", "2027-03-11", "2027-03-12"]);
  });

  it("produces an empty set when start equals end", () => {
    const set = expandRangesToDateSet([
      { start: "2027-03-10", end: "2027-03-10" },
    ]);
    expect(set.size).toBe(0);
  });

  it("deduplicates dates across overlapping ranges", () => {
    const set = expandRangesToDateSet([
      { start: "2027-03-10", end: "2027-03-13" },
      { start: "2027-03-12", end: "2027-03-15" },
    ]);
    expect([...set].sort()).toEqual([
      "2027-03-10",
      "2027-03-11",
      "2027-03-12",
      "2027-03-13",
      "2027-03-14",
    ]);
  });

  it("handles a range spanning a month boundary", () => {
    const set = expandRangesToDateSet([
      { start: "2027-01-30", end: "2027-02-02" },
    ]);
    expect([...set].sort()).toEqual(["2027-01-30", "2027-01-31", "2027-02-01"]);
  });

  it("returns an empty set for an empty ranges array", () => {
    const set = expandRangesToDateSet([]);
    expect(set.size).toBe(0);
  });
});
