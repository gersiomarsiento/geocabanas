# New client setup checklist

How to spin up a fresh instance of this project for a new property-owner
client. Written 2026-09-01 — this reflects the project as it stands right
now, including known gaps. **Update this file as those gaps get fixed**
(a few steps below explicitly say "until X is done" — once X is done,
simplify the step).

## 1. Supabase project

1. Create a new Supabase project for this client.
2. From Project Settings → API, grab the project URL and the **service
   role** key (not the anon key — this app only ever talks to Supabase
   server-side with the service role key).
3. Open the SQL editor and run `db/schema.sql` in full. This creates
   every table, the `create_group_reservation` function, RLS (enabled,
   no policies — everything goes through the service role client), and
   registers the `property-images` storage bucket.
4. There's no seed data yet — `db/seed.sql` is still on `TO_DO.md`. Until
   it exists, every property, FAQ, and site setting has to be entered by
   hand through the admin panel after first deploy (or directly in
   Supabase). Once the seed file exists, run it here too and just edit
   the sample data instead of starting from a blank slate.

## 2. Environment variables

Set locally in `.env.local` for development:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
ADMIN_PASSWORD=
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
```
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from step 1.
- `SESSION_SECRET` — generate a fresh one per client (`openssl rand
  -base64 32`), never reuse one across clients.
- `ADMIN_PASSWORD` — this client's admin login password. Single
  hardcoded password, no user table — see `CLAUDE.md`.
- `RESEND_API_KEY` — from this client's Resend account (or a shared
  account, your call, but keep the sending domain/address client-
  appropriate).
- `ADMIN_NOTIFICATION_EMAIL` — where new-reservation alerts go for this
  client (usually the property owner's own inbox).

For production (Cloudflare Workers), set the same variables as Worker
secrets — they are not read from `.env.local` at runtime:
```
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ADMIN_NOTIFICATION_EMAIL
```

## 3. Business identity — until the hardcoded-info fix lands

Per `TO_DO.md`, several pieces of this client's identity are currently
hardcoded in the code rather than editable through the admin panel:
- `app/components/ContactSection.tsx` — business name, phone number,
  full postal address, and the Facebook link all need direct code edits
  per client.
- Anywhere else with the same pattern that hasn't been audited yet (see
  `TO_DO.md` → "Hardcoded business info").

Once that item is done, this step shrinks to: set contact info, address,
and social links through the admin panel's site settings card instead.

## 4. Content that already goes through the admin panel

Log in at `/admin/login` with `ADMIN_PASSWORD` and set:
- Contact info that *is* already wired up: WhatsApp number, contact
  email (⚠️ currently has no visible effect on the site — see
  `TO_DO.md`), Instagram handle, map coordinates/address.
- Hero image, logo, hero title/subtitle/button text and about section
  copy (`es` only for now — `en`/`pt` versions aren't settable from the
  admin panel yet, see the translations audit item in `TO_DO.md`).
- Currency/exchange rates.
- FAQs (same `es`-only caveat).
- Properties: name, slug, description, photos, pricing, amenities,
  booking iCal URL, deposit percentage, etc.

## 5. Content that's still code-only

Per the admin-scope audit in `TO_DO.md`, this hasn't been formally
decided yet, but as of now these require a code change per client:
- `/messages/{es,en,pt}.json` — every static UI string.
- `app/components/ReviewsSection.tsx` — the testimonials shown are a
  hardcoded array, not live data.
- `lib/amenities.ts` — the fixed list of possible amenities.
- Anything in `app/components/AvailabilitySearch.tsx` — not yet wired
  into `next-intl` at all (see `TO_DO.md`).

## 6. Deploy

```bash
npm run deploy
```
Builds and pushes to Cloudflare Workers. Confirm the Worker secrets from
step 2 are set before the first deploy, or server-side code that reads
them will fail at runtime rather than build time.

## 7. Sanity check before handing off

- Log in to `/admin`, confirm you can edit a property and see the change
  reflected on the public site.
- Submit a real test reservation end-to-end (and delete it from Supabase
  afterward).
- Confirm the Resend sending address/domain is correct for this client —
  don't ship with a test placeholder address.
- Confirm `/api/test-db` and `/api/test-availability` return 404 (they
  should already be deleted per `TO_DO.md`, not just disabled).