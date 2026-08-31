# TO_DO — Geocabañas

Consolidated from a full project review on 2026-08-31. Grouped roughly by
urgency, not by when they were found.

## Security — do soon

- **`app/api/test-db/route.ts`** is public and unauthenticated (it's not
  under `/api/admin/`, so `middleware.ts` doesn't cover it) and dumps the
  entire `properties` table via `select("*")`. Delete it or move it
  behind admin auth.
- **`app/api/test-availability/route.ts`** is similarly public, with a
  hardcoded property ID and date range. Lower stakes, but it's debug
  scaffolding sitting in the live API surface — delete or gate it too.

## Data integrity

- **Reservation race condition:** `app/api/reservations/route.ts` checks
  for overlapping `pending`/`confirmed` reservations and *then* inserts,
  with nothing preventing two near-simultaneous submits from both passing
  the check before either insert lands (double-click, retry after a slow
  response, etc). This is the likely cause of the duplicate-reservation
  rows seen early on. Fix with a DB-level guard — e.g. a Postgres
  exclusion constraint on `(property_id, daterange(start_date, end_date))`
  — rather than relying on the application-level check alone.

## Cleanup

- Once `test-availability` is removed, `lib/booking/availability.ts`
  (`isDateAvailable` / `getAvailabilityRange`) has no remaining callers
  and can likely be deleted too — it's a fourth, separate reimplementation
  of the availability logic that isn't part of any real request path.

## Refactor opportunity

- The availability-precedence logic (reservation → calendar_days override
  → iCal → default) is duplicated across three real route files (visitor
  availability, admin availability, reservation creation). Worth
  factoring into one shared function so the three can't drift apart.

## Product gaps

- **No admin UI to set `en`/`pt` translations** for FAQ questions/
  answers, property descriptions, or site-settings hero/about copy — the
  admin routes for these only ever write the `es` key of the jsonb
  column. Decide how those translations should actually get populated
  (admin UI fields per locale? a separate translation pass/service?) and
  build it.
- **Seed data file:** since this project is meant to be duplicated as a
  template per property-owner client, a `db/seed.sql` (or a small script)
  that populates a fresh instance with a few mock properties, sample
  `calendar_days`, and a couple of FAQs would make spinning up a new demo
  or client instance much faster. Not started yet.

## Backlog / revisit later

- **Pending reservations don't auto-expire.** This is an accepted
  limitation for now — admin cancels manually via
  `PATCH /api/admin/reservations/[id]`. The `Booking.condicionesReserva`
  copy shown to guests says the request "quedará pendiente... durante 24
  horas... de lo contrario la misma se cancelará," but nothing in the
  code actually enforces that 24-hour window — worth keeping in mind
  since the UI promise and the system's real behavior don't match yet, in
  case it becomes worth fixing later.
- If this project does become a proper multi-client template, it may be
  worth writing down the actual "spin up a new client" checklist
  (Supabase project, env vars / Worker secrets, run `schema.sql`, run the
  future seed file, set branding/admin password) somewhere — not urgent
  while there's only one live instance, but worth having before there's a
  second one.
