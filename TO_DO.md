# TO_DO — Geocabañas

Only open items live here — finished work gets removed, not logged as
"resolved." (Started 2026-08-31; policy of removing finished items
adopted 2026-09-02, so anything before that date in git history may still
show the old resolved-notes style.)

See also `NEW_CLIENT_SETUP.md` — a couple of items below (translations,
seed data, bank account) are referenced from there too, since they
directly affect how much manual work a new client instance needs.
Update that file's affected steps as those items get resolved here.

## Translations audit

- **Property name/description translation** — not yet scoped. Depends on
  whether properties have freeform text fields at all (unconfirmed);
  check before deciding if this needs the same jsonb + Traducciones tab
  treatment as hero/about/FAQs/reviews.

## Product gaps

- **Seed data file:** since this project is meant to be duplicated as a
  template per property-owner client, a `db/seed.sql` (or a small script)
  that populates a fresh instance with a few mock properties, sample
  `calendar_days`, and a couple of FAQs would make spinning up a new demo
  or client instance much faster. Not started yet — deliberately saved
  for last.
- **Deposit bank-account info is hardcoded** in the guest confirmation
  email fallback (`lib/email/reservationEmails.ts` — `BROU: xxxxxxxx`).
  Discussed 2026-09-08: `site_settings` has no column for this, and
  adding one was deliberately deferred rather than done as a drive-by
  change. Each new client instance currently needs this line manually
  edited in code — worth a `site_settings` column (e.g.
  `deposit_account_info`) whenever this gets picked up, same spirit as
  the seed-data item above.

## Backlog / revisit later

- **Pending reservations don't auto-expire.** Accepted limitation for
  now — admin cancels manually via `PATCH /api/admin/reservations/[id]`.
  The `Booking.condicionesReserva` copy shown to guests says the request
  "quedará pendiente... durante 24 horas... de lo contrario la misma se
  cancelará," but nothing in the code actually enforces that 24-hour
  window — worth keeping in mind since the UI promise and the system's
  real behavior don't match yet, in case it becomes worth fixing later.

## Found via test-writing (2026-09-26)

Confirmed while writing the integration test suite — not theoretical,
each one has a passing test that demonstrates it.

- **`site_settings` PATCH silently no-ops when the singleton row
  doesn't exist.** `UPDATE ... WHERE id = 'singleton'` matching zero
  rows isn't a Postgres error, so the route returns `{ok: true}` even
  though nothing was saved. Any fresh client instance (no `seed.sql`
  yet, see Product gaps above) is in exactly this state until someone
  manually inserts the singleton row. Worth an upsert or an explicit
  existence check.
- **Reviews `PATCH /api/admin/reviews/[id]` returns 404 for two
  unrelated problems**: a genuinely nonexistent id, and a real database
  constraint violation (e.g. `rating` outside 1–5, or `source` outside
  `Google`/`Booking`/`Airbnb`) on a review that exists. Both currently
  say "Reseña no encontrada," which is actively misleading for the
  second case.
- **Reviews `DELETE` on a nonexistent id returns `{ok: true}`** — same
  root cause as the `site_settings` bug (a zero-row DB operation isn't
  an error), lower stakes here since nothing is lost, but worth knowing
  it can't be used to confirm something actually existed before the
  call.

## Known inconsistencies (not bugs, but worth resolving one way)

- Single-property reservation route returns 400 for a min-stay
  failure; the group reservation route returns 409 for the same kind
  of failure, with wording that implies a date conflict rather than a
  too-short stay.
- Admin reservation cancellation (`PATCH
  /api/admin/reservations/[id]`) returns 500, not 404, for an unknown
  reservation id.
- `site_settings` PATCH: a reservation conflict only blocks an
  *availability* change (a price-only edit goes through on a reserved
  date), but an iCal conflict blocks *any* field change on that date
  unless `confirmIcalOverride` is set — same conflict-resolution
  design, two different rules.
- `lib/calendar/dates.ts` mixes UTC-based date stepping (`nextDate`,
  `isoDate`) with local-time-based stepping (`enumerateRange`,
  `rangeHasDateInSet`) for the same kind of job. Unlikely to bite given
  Uruguay has no DST, but worth being aware of if this ever runs in a
  different timezone context.

## Lower-priority gaps found via testing

- Neither reviews nor FAQs validate `rating` range or `source`/enum
  values before hitting the database — invalid values surface as raw
  Postgres constraint-violation messages via a generic 500, not a
  clean 400.
- The four upload routes (property images, Instagram posts, site hero,
  site logo) accept any `File` with no MIME-type or size validation.
- Properties `POST`'s slug-collision retry loop doesn't re-check the
  final generated slug after its 5th attempt before inserting —
  astronomically unlikely to collide, but no guard if it does.
- Some integration test files still use hardcoded slugs rather than
  the random-suffix pattern most of the suite uses — lower risk now
  that `jest.integration.globalSetup.ts` resets the DB automatically,
  but still fragile against a mid-run crash.
- ESLint doesn't recognize Jest globals (`describe`, `expect`, etc.) in
  test files; an attempted flat-config fix didn't take. Cosmetic only.

## To verify against the real (not local) Supabase project

- RLS is enabled with zero policies on every table — confirm this
  actually blocks anon/client-side access against the real project,
  not just the local Docker instance.
- Storage bucket public-read behavior — confirm it works the same
  against real Supabase Storage.
- Single hardcoded `ADMIN_PASSWORD` with no rate-limiting/lockout —
  not a bug, but a conscious risk decision worth making deliberately
  rather than by default.

## Untested surface

- The four upload routes listed above have no tests yet at all (not
  just the validation gap) — pending a decision on testing against
  real local Supabase Storage vs. mocking the storage client.