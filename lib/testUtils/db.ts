// Test-only helpers for integration tests against the local Supabase
// instance. NOT imported by any app code — lives under lib/ only so it
// can use the "@/lib/..." path alias like everything else.

import { supabaseAdmin } from "@/lib/supabase/admin";

export function uniqueSlug(base: string): string {
    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
  }

const createdPropertyIds: string[] = [];

const createdFaqIds: string[] = [];

const createdReviewIds: string[] = [];

const createdStoragePaths: string[] = [];

const createdInstagramPostIds: string[] = [];

export function trackStoragePath(path: string): void {
  createdStoragePaths.push(path);
}


export function trackInstagramPostId(id: string): void {
  createdInstagramPostIds.push(id);
}

export interface TestReviewOverrides {
  author?: string;
  rating?: number;
  source?: "Google" | "Booking" | "Airbnb";
  url?: string;
  text?: { es: string; en?: string; pt?: string };
  sort_order?: number;
}

export async function createTestReview(
  overrides: TestReviewOverrides = {},
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      author: overrides.author ?? "Test Author",
      rating: overrides.rating ?? 5,
      source: overrides.source ?? "Google",
      url: overrides.url ?? "https://example.com/review",
      text: overrides.text ?? { es: "Reseña de prueba" },
      sort_order: overrides.sort_order ?? 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`createTestReview failed: ${error?.message}`);
  }

  createdReviewIds.push(data.id);
  return data.id;
}

export function trackReviewId(id: string): void {
  createdReviewIds.push(id);
}

export interface TestFaqOverrides {
  question?: { es: string; en?: string; pt?: string };
  answer?: { es: string; en?: string; pt?: string };
  sort_order?: number;
}

export async function createTestFaq(
  overrides: TestFaqOverrides = {},
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("faqs")
    .insert({
      question: overrides.question ?? { es: "Pregunta de prueba" },
      answer: overrides.answer ?? { es: "Respuesta de prueba" },
      sort_order: overrides.sort_order ?? 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`createTestFaq failed: ${error?.message}`);
  }

  createdFaqIds.push(data.id);
  return data.id;
}

export function trackFaqId(id: string): void {
  createdFaqIds.push(id);
}

export interface TestPropertyOverrides {
  name?: string;
  slug?: string;
  default_price?: number;
  default_min_stay?: number;
  deposit_percentage?: number;
  external_ical_url?: string | null;
}

/**
 * Inserts a minimal valid property row and returns its id. Tracks the id
 * so cleanup() can remove it (and, via ON DELETE CASCADE, any
 * calendar_days/reservations rows created against it) after each test.
 */
export async function createTestProperty(
  overrides: TestPropertyOverrides = {},
): Promise<string> {
  const suffix = crypto.randomUUID().slice(0, 8);

  const { data, error } = await supabaseAdmin
    .from("properties")
    .insert({
      name: overrides.name ?? `Test Property ${suffix}`,
      slug: overrides.slug ?? `test-property-${suffix}`,
      default_price: overrides.default_price ?? 100,
      default_min_stay: overrides.default_min_stay ?? 1,
      deposit_percentage: overrides.deposit_percentage ?? 0,
      external_ical_url: overrides.external_ical_url ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`createTestProperty failed: ${error?.message}`);
  }

  createdPropertyIds.push(data.id);
  return data.id;
}

export interface TestCalendarDayOverrides {
  status?: "available" | "blocked";
  price?: number;
  min_stay?: number;
}

export async function createTestCalendarDay(
  propertyId: string,
  date: string,
  overrides: TestCalendarDayOverrides = {},
): Promise<void> {
  const { error } = await supabaseAdmin.from("calendar_days").insert({
    property_id: propertyId,
    date,
    status: overrides.status ?? "blocked",
    price: overrides.price ?? null,
    min_stay: overrides.min_stay ?? null,
  });

  if (error) {
    throw new Error(`createTestCalendarDay failed: ${error.message}`);
  }
}

export interface TestReservationOverrides {
  status?: "pending" | "confirmed" | "cancelled" | "expired";
}

export async function createTestReservation(
  propertyId: string,
  startDate: string,
  endDate: string,
  overrides: TestReservationOverrides = {},
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("reservations")
    .insert({
      property_id: propertyId,
      guest_name: "Test Guest",
      guest_email: "test@example.com",
      guest_phone: "000000000",
      start_date: startDate,
      end_date: endDate,
      status: overrides.status ?? "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`createTestReservation failed: ${error?.message}`);
  }

  return data.id;
}

export function trackPropertyId(id: string): void {
    createdPropertyIds.push(id);
  }

/**
 * Deletes every property created via createTestProperty since the last
 * cleanup() call. Call this in afterEach. Cascade deletes handle the
 * child calendar_days/reservations rows.
 */
export async function cleanup(): Promise<void> {
  if (createdPropertyIds.length > 0) {
    const { error } = await supabaseAdmin
      .from("properties")
      .delete()
      .in("id", createdPropertyIds);
    if (error) throw new Error(`cleanup (properties) failed: ${error.message}`);
    createdPropertyIds.length = 0;
  }

  if (createdFaqIds.length > 0) {
    const { error } = await supabaseAdmin
      .from("faqs")
      .delete()
      .in("id", createdFaqIds);
    if (error) throw new Error(`cleanup (faqs) failed: ${error.message}`);
    createdFaqIds.length = 0;
  }

  if (createdReviewIds.length > 0) {
    const { error } = await supabaseAdmin
      .from("reviews")
      .delete()
      .in("id", createdReviewIds);
    if (error) throw new Error(`cleanup (reviews) failed: ${error.message}`);
    createdReviewIds.length = 0;
  }

  if (createdInstagramPostIds.length > 0) {
    const { error } = await supabaseAdmin
      .from("instagram_posts")
      .delete()
      .in("id", createdInstagramPostIds);
    if (error) throw new Error(`cleanup (instagram_posts) failed: ${error.message}`);
    createdInstagramPostIds.length = 0;
  }

  if (createdStoragePaths.length > 0) {
    const { error } = await supabaseAdmin.storage
      .from("property-images")
      .remove(createdStoragePaths);
    if (error) throw new Error(`cleanup (storage) failed: ${error.message}`);
    createdStoragePaths.length = 0;
  }
}
