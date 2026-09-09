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

- **Admin can now translate hero/about copy, FAQs, and reviews**
  (2026-09-09): a "Traducciones" tab (`app/admin/traducciones/`) lets the
  admin fill in `en`/`pt` for each field, reading/writing the raw
  `{es,en,pt}` jsonb via a new aggregate `GET /api/admin/translations`
  and the existing per-resource PATCH routes. The write-path bug where
  those PATCH routes only ever wrote the `es` key (site-settings, faqs,
  reviews) is fixed across the board. Property name/description
  translation was explicitly deferred to a later session — not yet
  scoped, may or may not need the same treatment depending on whether
  properties have freeform text fields (unconfirmed).
- **Public `ReviewsSection.tsx` may still read from the hardcoded
  `REVIEWS` array instead of the `reviews` table** — the admin CRUD
  (`SiteReviewsCard.tsx`, `/api/admin/reviews`) already existed before
  this session, but whether the public-facing component was switched
  over wasn't confirmed here. Worth checking before relying on the
  Traducciones tab's review translations actually showing up on the
  site.
- **Reservation confirmation/admin-notification emails are hardcoded
  Spanish** (`lib/email/reservationEmails.ts`) — in progress. Scoped
  2026-09-09, not yet built:
  - Neither `POST /api/reservations` nor `POST /api/reservations/group`
    accept a `locale` in the request body — the guest's selected
    language never reaches the backend at all, which is the actual
    blocker (not just missing translated strings).
  - Static labels in the email HTML ("Check-in", "Total", "Seña
    requerida", etc.) are hardcoded Spanish, as are `formatDate`/`money`
    (`Intl` calls hardcoded to `es-UY`).
  - Plan: add `locale` to `BookingCalendar.tsx` and the group-booking
    form's POST bodies (via `useLocale()`); thread it through both API
    routes into `sendReservationEmails`; move `emailSubject`/
    `emailIntro` into the same localized-jsonb pattern as hero/about
    (including the `SiteEmailCard.tsx` caller fix); move static labels
    into a new `Email` namespace in `messages/*.json`, read server-side
    (can't use `useTranslations()` outside React); localize
    `formatDate`/`money` per locale (assumed `es-UY`/`en-US`/`pt-BR` —
    unconfirmed, flag if wrong). Admin notification email intentionally
    stays Spanish-only (internal, not guest-facing).
  - Still need `lib/site/settings.ts`, `SiteEmailCard.tsx`, and the
    group-booking form before continuing — that's where the next
    session should pick up.

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
  