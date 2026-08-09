# CLAUDE.md — Geocabañas project context

Property booking site for Geocabañas (Punta del Diablo, Uruguay). Visitors
browse availability/pricing and submit a reservation request; an admin
manages availability, pricing, and property details through a separate panel.

## Stack

- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS
- **Database:** Supabase (Postgres) — accessed server-side only via the
  service role key, never from the client
- **File storage:** Supabase Storage (property images)
- **Email:** Resend (`lib/email/resend.ts`, `lib/email/reservationEmails.ts`)
- **Hosting:** Cloudflare Workers, via the OpenNext adapter
  (`@opennextjs/cloudflare`) — NOT Vercel, NOT Cloudflare Pages'
  `next-on-pages` (deprecated, Edge-only, doesn't support the Node APIs
  this project needs)

## Critical project-wide convention

**All dynamic route params are `Promise`-based.** Every `[id]`/`[slug]`
route handler must be written as:
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  ...
}
```
Writing the older non-Promise signature is the single most common bug
we've hit rebuilding this project — it compiles fine locally in some
cases but fails type-checking at build time. Always use the Promise form.

## Data model (Supabase)

- **`properties`** — one row per property/room. Key columns:
  `default_price`, `default_min_stay`, `min_reservation_fee`,
  `booking_ical_url` (per-property, not a shared env var), `currency`.
- **`calendar_days`** — admin overrides, one row per property per day.
  `status` is `'blocked'` | `'available'` (force-open) | `null` (no
  override — defer to iCal/default). Also carries per-day `price` and
  `min_stay` overrides.
- **`reservations`** — guest bookings made through this site. `status` is
  `'pending'` | `'confirmed'` | `'cancelled'`. Has `total_price` and
  `deposit_amount` (both added via migration after the initial schema).
- **`property_images`** — one row per photo, `storage_path` points into
  the `property-images` Storage bucket (public bucket, service-role-only
  writes).

## Availability precedence (the core logic)

For any given day, in order — first match wins:
1. **Active internal reservation** (`pending`/`confirmed` in
   `reservations`) → always unavailable. This is authoritative and
   cannot be overridden by `calendar_days` — the only way to free such a
   date is to cancel the reservation itself
   (`PATCH /api/admin/reservations/[id]` with `{status: "cancelled"}`).
2. **`calendar_days` override** → explicit admin block, or explicit
   "force available" (meaningful only for overriding stale iCal data,
   never for overriding a real reservation).
3. **Booking.com iCal feed** (`lib/booking/bookingCalendar.ts`, fetched
   via `getBookedRanges(property.booking_ical_url)`) → unavailable unless
   overridden.
4. Otherwise → available.

This exact logic is duplicated across three places (visitor availability
route, admin availability route, reservation creation route) rather than
factored into one shared function — a known refactor opportunity, not yet
done.

## iCal sync direction

- **Inbound (Booking.com → us):** working, via `bookingCalendar.ts`.
- **Outbound (us → Airbnb):** `app/api/ical/[slug]/route.ts` exists but
  is still a stub — it returns an empty calendar. Booking.com itself no
  longer accepts iCal imports from personal sites (changed March 2025);
  Airbnb still does, one-directionally, which is the intended use for
  this endpoint once it's built out.

## Admin auth

Single hardcoded password (`ADMIN_PASSWORD` env var), no user table.
Signed JWT session cookie, issued/verified in `lib/auth.ts`.
`middleware.ts` protects `/admin/:path*` and `/api/admin/:path*`, with
`/admin/login` and `/api/admin/login` /`/api/admin/logout` excluded.
Several individual route files still carry `// TODO: gate this route
behind your admin auth/session check before ship` comments left over
from early scaffolding — these are stale; the middleware already covers
them. Worth a pass to delete the stale comments so they don't cause
confusion later.

## Environment variables

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
ADMIN_PASSWORD=
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
```

(`BOOKING_ICAL_URL` was an early env var, since replaced by the
per-property `booking_ical_url` column — should not exist anymore.)

## Known incomplete / open items

- Outbound iCal export (`ical/[slug]/route.ts`) not populated with real
  blocked-date events yet.
- No admin action yet to flip a reservation from `pending` → `confirmed`
  (only `cancelled` is implemented, via the reservation-conflict flow).
- "Hide prices from visitors" toggle — discussed, not yet built (needs a
  new `properties` column plus wiring into the visitor route/UI).
- Min-stay/deposit are property-level defaults only; no per-date-range
  override UI for them specifically (the underlying `calendar_days`
  columns exist and are usable, just not surfaced distinctly in the
  admin UI beyond the general price/status editor).
- `lib/admin/mock-admin-store.ts` — was mistakenly still wired into one
  route (`PATCH /api/admin/properties/[id]`), now fixed to use real
  Supabase. Confirm nothing else references this file, then delete it.
- Two identical `reservations` rows were observed early on for the same
  guest/dates — root cause not confirmed; possible double-submit on the
  reservation form. Worth watching for recurrence.