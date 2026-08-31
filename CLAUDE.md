# CLAUDE.md — Geocabañas project context

Property booking site for Geocabañas (Punta del Diablo, Uruguay). Visitors
browse availability/pricing and submit a reservation request; an admin
manages availability, pricing, and property details through a separate panel.

Last verified against the live Supabase schema and codebase: 2026-08-31.
See `TO_DO.md` for known gaps and open work — this file describes how the
project currently works, not what's left to do.

## Stack

- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Database:** Supabase (Postgres) — accessed server-side only via the
  service role key, never from the client
- **File storage:** Supabase Storage (property images, bucket
  `property-images`, public)
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

## Two separate i18n systems — don't confuse them

1. **Static UI strings** (buttons, labels, form copy) live in
   `/messages/{es,en,pt}.json` and are rendered via `next-intl`. Locale is
   routed through the URL prefix (`/en`, `/pt`; `es` is the default at the
   root). If you're translating a fixed piece of interface text, this is
   where it goes.
2. **Dynamic, admin-editable content** (property descriptions, FAQs, hero
   and about-section copy) is stored directly in Postgres as `jsonb` in
   the shape `{"es": "...", "en"?: "...", "pt"?: "..."}`, and unwrapped
   per-request via `lib/i18n/getLocalized.ts`, which falls back to `es` if
   the requested locale key is missing. This is a completely separate
   system from the `messages/` files.

Currently, the admin FAQ routes (`app/api/admin/faqs/*`) only ever write
the `es` key of that jsonb blob on create/update — there's no admin UI
path to set `en`/`pt` for an individual FAQ, property description, or
site-settings copy field. See `TO_DO.md`.

## Data model (Supabase)

See `db/schema.sql` for the authoritative column-level definition
(regenerated from the live DB — treat the live DB as the source of truth
over this file if the two ever disagree). Key points:

- **`properties`** — one row per property/room. `default_price`,
  `default_min_stay`, `min_reservation_fee`, `deposit_percentage` are the
  property-level defaults used when a stay has no `calendar_days`
  override. `booking_ical_url` is per-property, not a shared env var.
  `hide_nightly_price` toggles whether the nightly rate is shown to
  visitors — fully wired end-to-end (admin checkbox, admin API, public
  properties API, `BookingCalendar.tsx`).
- **`calendar_days`** — admin overrides. A row only exists for a
  property+date that has an explicit override; no row means "no
  override, defer to iCal/default." `status` is `'blocked'` or
  `'available'` (force-open, meaningful only for overriding stale iCal
  data, never for overriding a real reservation). Also carries per-day
  `price` and `min_stay` overrides.
- **`reservations`** — guest bookings made through this site. `status` is
  `'pending'` | `'confirmed'` | `'cancelled'` | `'expired'` at the DB
  level, but the app never sets or checks `'expired'` in practice —
  `expires_at` exists on the row but nothing writes or reads it in any
  live code path. **Pending reservations do not auto-expire.** They stay
  authoritative (blocking those dates) until an admin manually cancels
  them via `PATCH /api/admin/reservations/[id]` with
  `{status: "cancelled"}`. This is an accepted, deliberate limitation for
  now, not a bug to fix — see `TO_DO.md` if that ever needs revisiting.
- **`property_images`** — one row per photo, `storage_path` points into
  the `property-images` Storage bucket (public bucket, service-role-only
  writes).
- **`faqs`** — `question`/`answer` are localized jsonb (see i18n section
  above).
- **`site_settings`** — singleton row (`id = 'singleton'`) holding
  site-wide contact info, map location, hero/about copy, transactional
  email copy, and currency exchange rates (`exchange_rate_uyu`,
  `exchange_rate_brl`).

## Availability precedence (the core logic)

For any given day, in order — first match wins:
1. **Active internal reservation** (`pending`/`confirmed` in
   `reservations`) → always unavailable. This is authoritative and
   cannot be overridden by `calendar_days` — the only way to free such a
   date is to cancel the reservation itself.
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
done. (`lib/booking/availability.ts` / `isDateAvailable` is a fourth,
separate implementation, but it's only used by the debug
`app/api/test-availability` route, not by any of the three real ones.)

## iCal sync direction

- **Inbound (Booking.com → us):** working, via `bookingCalendar.ts`.
- **Outbound (us → Airbnb):** `app/api/ical/[slug]/route.ts` is
  implemented — it merges Booking.com iCal data, `calendar_days`
  overrides, and internal reservations into unavailable-date ranges and
  serves a real `.ics` feed. Booking.com itself no longer accepts iCal
  imports from personal sites (changed March 2025); Airbnb still does,
  one-directionally, which is what this endpoint feeds.

## Admin auth

Single hardcoded password (`ADMIN_PASSWORD` env var), no user table.
Signed JWT session cookie, issued/verified in `lib/auth.ts`.
`middleware.ts` protects `/admin/:path*` and `/api/admin/:path*`, with
`/admin/login` and `/api/admin/login`/`/api/admin/logout` excluded.
Several individual route files under `app/api/admin/` still carry
`// TODO: gate this route behind your admin auth/session check before
ship` comments left over from early scaffolding — these are stale; the
middleware already covers them. Cleanup tracked in `TO_DO.md`.

## Environment variables

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
ADMIN_PASSWORD=
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
```