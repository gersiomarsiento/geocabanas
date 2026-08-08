// Shared types for the admin availability/pricing feature.
// Import these from both the API routes and the admin component so the
// shapes never drift apart.

export type Property = {
  id: string;
  name: string;
  /** Fallback nightly price used when a specific day has no override. */
  defaultPrice: number;
  /** Fallback minimum-nights rule used when a specific day has no override. */
  defaultMinStay: number;
  /** Minimum deposit required to confirm a reservation, in the same currency. */
  minReservationFee: number;
  currency: string; // e.g. "UYU", "USD"
};

export type DayRate = {
  date: string; // "YYYY-MM-DD"
  /** Admin-controlled flag. false = manually blocked (maintenance, owner use, etc). */
  available: boolean;
  /** true = occupied by a confirmed guest reservation. Read-only from this calendar. */
  reserved: boolean;
  /** Per-night price override. null falls back to property.defaultPrice. */
  price: number | null;
  /** Minimum consecutive nights required if a stay starts on this date. null falls back to property.defaultMinStay. */
  minStay: number | null;
};

export type AvailabilityResponse = {
  propertyId: string;
  days: DayRate[];
};

export type BulkUpdatePayload = {
  propertyId: string;
  startDate: string; // "YYYY-MM-DD", inclusive
  endDate: string; // "YYYY-MM-DD", inclusive
  available?: boolean;
  /** Pass null explicitly to clear an override and fall back to the property default. */
  price?: number | null;
  minStay?: number | null;
};

export type PropertySettingsUpdate = {
  defaultPrice?: number;
  defaultMinStay?: number;
  minReservationFee?: number;
};
