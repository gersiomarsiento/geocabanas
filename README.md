# Geocabañas

Booking site for Geocabañas (Punta del Diablo, Uruguay). Visitors can check
availability and pricing and submit a reservation request; an admin panel
manages properties, availability overrides, and pricing.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Supabase** — Postgres database + file storage for property photos
- **Resend** — transactional email (reservation confirmations)
- **Cloudflare Workers** — hosting, via the OpenNext adapter

## Getting started

```bash
npm install
```

Create `.env.local` with:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
ADMIN_PASSWORD=
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
```

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase
  project settings (API section). Use the **service role** key, not the
  anon key.
- `SESSION_SECRET` — any long random string (e.g. `openssl rand -base64 32`).
- `ADMIN_PASSWORD` — the password for the single admin login at `/admin/login`.
- `RESEND_API_KEY` — from resend.com, once you've created an account.
- `ADMIN_NOTIFICATION_EMAIL` — the inbox that should receive new-reservation alerts.

Then run the dev server:

```bash
npm run dev
```

Each property's Booking.com iCal export URL is stored per-property in the
database (`properties.booking_ical_url`), not as an env var — set it from
the admin panel or directly in Supabase.

## Database setup

`db/schema.sql` is a single, current snapshot of the live schema (not a
sequence of incremental migrations) — run it once against a fresh Supabase
project's SQL editor to create every table, enable RLS, and register the
`property-images` storage bucket. This intentionally matches how this
project is meant to be used: as a template duplicated into a fresh
Supabase project per property-owner client, rather than one database
evolving over years. Keep it that way — after any schema change, update
`db/schema.sql` itself (rather than adding migration files) so a new
client instance is always one script away. A seed file for sample
property data is planned; see `TO_DO.md`.

## Deployment

Hosted on Cloudflare Workers via OpenNext (not Vercel, not Cloudflare
Pages).

```bash
npm run deploy
```

This builds the app and pushes it live. Environment variables need to be
set separately as Cloudflare Worker secrets (`npx wrangler secret put
VARIABLE_NAME`) — they are not read from `.env.local` in production.

See `CLAUDE.md` for a deeper architecture reference (data model,
availability logic, i18n setup) if you're picking this project back up
after a while or handing it to someone else. See `TO_DO.md` for known
gaps and open work.

## Project structure

```
app/
  admin/              Admin panel (protected by middleware.ts)
  api/                API routes
  components/         Shared UI (visitor calendar, sections, icons)
  [locale]/           Localized visitor-facing pages (next-intl)
    reserva-confirmada/  Post-reservation confirmation page
lib/
  booking/            iCal fetch/parse logic + availability helpers
  calendar/           Date utilities shared by admin + visitor calendars
  currency/           Currency conversion for displayed prices
  email/              Resend client + email templates
  i18n/               next-intl config + jsonb localized-field helper
  site/               Site-settings / hero / theme accessors
  supabase/           Supabase client
  auth.ts             Admin session (JWT) issue/verify
  amenities.ts        Amenity list/labels
  resizeImageForUpload.ts  Client-side image resize before upload
types/
  *.ts                Shared TypeScript types for admin/API payloads
db/
  schema.sql          Current live schema, run manually in Supabase
messages/
  es.json, en.json, pt.json   Static UI strings for next-intl
```