// lib/calendar/dates.ts

export type DateParts = {
  year: number;
  month: number; // 0-11 como Date de JS
  day: number;
};

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function toDateKey({ year, month, day }: DateParts): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function fromDateKey(date: string): DateParts {
  const [year, month, day] = date.split("-").map(Number);

  return {
    year,
    month: month - 1,
    day,
  };
}

export function toDate(parts: DateParts): Date {
  return new Date(parts.year, parts.month, parts.day);
}

export function nextDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  const d = new Date(Date.UTC(year, month - 1, day));

  d.setUTCDate(d.getUTCDate() + 1);

  return d.toISOString().slice(0, 10);
}

export function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  return cells;
}

export function enumerateRange(start: DateParts, end: DateParts): string[] {
  const keys: string[] = [];

  const current = toDate(start);
  const endTime = toDate(end).getTime();

  while (current.getTime() <= endTime) {
    keys.push(
      toDateKey({
        year: current.getFullYear(),
        month: current.getMonth(),
        day: current.getDate(),
      }),
    );

    current.setDate(current.getDate() + 1);
  }

  return keys;
}

// Expands [{start, end}] ranges into a flat Set of individual "YYYY-MM-DD"
// keys, so day-lookups in the grid are O(1). `end` is treated as checkout
// day (exclusive), matching how Booking.com's iCal feed represents stays.
export function expandRangesToDateSet(
  ranges: { start: string; end: string }[],
): Set<string> {
  const set = new Set<string>();

  for (const { start, end } of ranges) {
    let current = start;

    while (current < end) {
      set.add(current);
      current = nextDate(current);
    }
  }

  return set;
}

// True if any night strictly between start and end (i.e. any night of
// the stay) is booked. Check-in/check-out days themselves are checked
// separately since they're disabled at the button level.
export function rangeHasDateInSet(
  start: DateParts,
  end: DateParts,
  dateSet: Set<string> | null,
): boolean {
  if (!dateSet) return false;

  const cur = toDate(start);
  const endTime = toDate(end).getTime();

  while (cur.getTime() < endTime) {
    const key = toDateKey({
      year: cur.getFullYear(),
      month: cur.getMonth(),
      day: cur.getDate(),
    });

    if (dateSet.has(key)) {
      return true;
    }

    cur.setDate(cur.getDate() + 1);
  }

  return false;
}
