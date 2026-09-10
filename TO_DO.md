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
