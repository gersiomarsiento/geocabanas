# TO_DO — Geocabañas

Only open items live here — finished work gets removed, not logged as
"resolved." (Started 2026-08-31; policy of removing finished items
adopted 2026-09-02, so anything before that date in git history may still
show the old resolved-notes style.)

See also `NEW_CLIENT_SETUP.md` — a couple of items below (translations,
seed data) are referenced from there too, since they directly affect how
much manual work a new client instance needs. Update that file's affected
steps as those items get resolved here.

## Refactor opportunity

- The availability-precedence logic (reservation → calendar_days override
  → iCal → default) is duplicated across four real routes: visitor
  availability, admin availability, reservation creation, and
  `booking/search` + `reservations/group` sharing a fourth copy via
  `lib/booking/availability.ts`. Worth factoring into one shared function
  so none of them can drift apart from each other — the more places this
  lives, the more likely one of them quietly diverges.

## Translations audit

- **Missing `en`/`pt` values** on content that *is* in the i18n system:
  FAQ questions/answers, property descriptions, and site-settings
  hero/about copy are all localized `jsonb`, but the admin routes for
  all of them only ever write the `es` key. Decide how `en`/`pt` should
  actually get populated — admin UI fields per locale, or a separate
  translation pass/service — and build it.

## Product gaps

- **Seed data file:** since this project is meant to be duplicated as a
  template per property-owner client, a `db/seed.sql` (or a small script)
  that populates a fresh instance with a few mock properties, sample
  `calendar_days`, and a couple of FAQs would make spinning up a new demo
  or client instance much faster. Not started yet — deliberately saved
  for last.
- **Hardcoded-business-info audit isn't fully done.** `ContactSection.tsx`
  is fixed, but `lib/email/reservationEmails.ts` templates and
  `app/layout.tsx` metadata haven't been checked for the same pattern
  (business name/contact info baked into code instead of pulled from
  `site_settings`).

## Backlog / revisit later

- **Pending reservations don't auto-expire.** Accepted limitation for
  now — admin cancels manually via `PATCH /api/admin/reservations/[id]`.
  The `Booking.condicionesReserva` copy shown to guests says the request
  "quedará pendiente... durante 24 horas... de lo contrario la misma se
  cancelará," but nothing in the code actually enforces that 24-hour
  window — worth keeping in mind since the UI promise and the system's
  real behavior don't match yet, in case it becomes worth fixing later.