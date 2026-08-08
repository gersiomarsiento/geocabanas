// Mock in-memory store so the routes below are runnable out of the box.
// Swap this out for your real database (Prisma, Supabase, etc). The shapes
// in types/admin-availability.ts are the contract to preserve.

import type { DayRate, Property } from "@/types/admin-availability";

type Store = {
  properties: Property[];
  // key: `${propertyId}:${date}`
  overrides: Map<string, Omit<DayRate, "date">>;
};

const globalForStore = globalThis as unknown as { __adminStore?: Store };

export const store: Store =
  globalForStore.__adminStore ??
  (globalForStore.__adminStore = {
    properties: [
      {
        id: "casa-del-mar",
        name: "Casa del Mar",
        defaultPrice: 8500,
        defaultMinStay: 2,
        minReservationFee: 5000,
        currency: "UYU",
      },
      {
        id: "cabana-bosque",
        name: "Cabaña del Bosque",
        defaultPrice: 6200,
        defaultMinStay: 3,
        minReservationFee: 4000,
        currency: "UYU",
      },
    ],
    overrides: new Map(),
  });

export function getDayRate(propertyId: string, dateKey: string): DayRate {
  const override = store.overrides.get(`${propertyId}:${dateKey}`);
  return {
    date: dateKey,
    available: override?.available ?? true,
    reserved: override?.reserved ?? false,
    price: override?.price ?? null,
    minStay: override?.minStay ?? null,
  };
}

export function setDayRate(
  propertyId: string,
  dateKey: string,
  patch: { available: boolean; price: number | null; minStay: number | null },
) {
  const key = `${propertyId}:${dateKey}`;
  const existing = store.overrides.get(key);
  store.overrides.set(key, {
    available: patch.available,
    reserved: existing?.reserved ?? false,
    price: patch.price,
    minStay: patch.minStay,
  });
}
