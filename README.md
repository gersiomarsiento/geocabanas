# Geocabañas

Booking site for Geocabañas (Punta del Diablo, Uruguay). Visitors can check
availability and pricing and submit a reservation request; an admin panel
manages properties, availability overrides, and pricing.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
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

Run the SQL migration files in `db/` (in order, oldest first) in the
Supabase SQL editor to create the schema and the `property-images`
storage bucket.

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
availability logic, known open items) if you're picking this project back
up after a while or handing it to someone else.

## Project structure

```
app/
  admin/            Admin panel (protected by middleware.ts)
  api/               API routes
  components/        Shared UI (visitor calendar, etc.)
  reserva-confirmada/  Post-reservation confirmation page
lib/
  booking/           iCal fetch/parse logic
  calendar/          Date utilities shared by admin + visitor calendars
  email/             Resend client + email templates
  supabase/          Supabase client
db/
  *.sql              Schema + migrations, run manually in Supabase
```