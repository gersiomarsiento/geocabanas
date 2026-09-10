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
- **Confirm `ReviewsSection.tsx` reads from the `reviews` table**, not
  the hardcoded `REVIEWS` array — unconfirmed whether the public-facing
  component was ever switched over.
- **Confirm the email localization work actually works end-to-end.**
  Built 2026-09-09 (locale threading, localized subject/intro,
  translated labels, per-locale date/number formatting) but no test run
  has been reported back yet — see the step-by-step test list from that
  session if picking this back up. Date/number formatting assumes
  `es-UY`/`en-US`/`pt-BR`; flag if a different regional variant is
  wanted.
  guest `locale` is sent from `BookingCalendar.tsx` and
  `AvailabilitySearch.tsx`, threaded through `POST /api/reservations`
  and `POST /api/reservations/group` into `sendReservationEmails`.
  `emailSubject`/`emailIntro` are localized jsonb now (same pattern as
  hero/about), editable per-locale from the Traducciones tab, with
  hardcoded per-locale fallback copy when the admin hasn't set custom
  text for a given language. Static email labels ("Check-in", "Total",
  etc.) moved into a new `Email` namespace in `messages/*.json`, read
  server-side via `lib/i18n/getEmailMessages.ts` (bypasses next-intl's
  request-scoped config, since the guest's locale isn't the current
  request's locale). Date/number formatting assumes
  `es-UY`/`en-US`/`pt-BR` — unconfirmed regional variants, flag if
  wrong. Admin notification email intentionally stays Spanish-only.
  **Not yet confirmed working end-to-end** — built and reviewed this
  session, but no test run has been reported back yet.

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
- **Guest confirmation email always shows a hardcoded 50% deposit, not the actual configured amount.**  
- Discovered 2026-09-09 while localizing
  `lib/email/reservationEmails.ts` — the deposit row in
  `sendGuestConfirmationEmail` renders `data.totalPrice / 2` instead of
  the `data.depositAmount` that's already computed from
  `property.deposit_percentage` and passed into the function. If a
  property's deposit percentage is ever set to anything other than 50,
  the number a guest sees in the email won't match what's actually owed.
  Fix is presumably a one-line swap (`totalPrice / 2` →
  `depositAmount`), but wasn't made during the localization pass to
  avoid bundling an unrelated behavior change — left for a dedicated fix.
  