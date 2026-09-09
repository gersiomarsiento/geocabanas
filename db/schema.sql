-- Geocabañas — Supabase schema
--
-- Regenerated 2026-08-31 from a live `information_schema.columns` dump of
-- the production database (public schema only). This replaces the old
-- schema.sql, which only reflected the initial migration and had drifted
-- badly out of sync with reality (missing columns, missing tables, wrong
-- types on the i18n fields).
--
-- CAVEAT: the source dump only listed columns (name / type / nullable /
-- default) — it did not include check constraints, foreign keys, indexes,
-- or RLS policies. Where a table existed in the old schema.sql, those
-- constraints are carried forward here as a best-effort reconstruction,
-- not independently re-verified against the live DB. If you can pull
-- `information_schema.table_constraints` (or `pg_get_constraintdef`)
-- later, this file can be tightened up against that.
--
-- google_reviews_cache existed in production but was never wired into any
-- code path (ReviewsSection.tsx uses a hardcoded array) and has been
-- intentionally dropped from this schema. See the cleanup note at the
-- bottom of this file to remove it from an existing database.

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";


-- ==========================
-- PROPERTIES
-- ==========================

create table properties (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,

  -- Localized rich text: {"es": "...", "en"?: "...", "pt"?: "..."}
  -- Read via lib/i18n/getLocalized.ts.
  description jsonb,

  location text,
  address text,

  max_guests int,
  bedrooms int,
  bathrooms int,

  contact_email text,
  whatsapp text,

  default_min_stay int not null default 1,
  default_price numeric(10,2) not null default 0,
  min_reservation_fee numeric(10,2) not null default 0,
  deposit_percentage numeric(5,2) not null default 0,

  currency text not null default 'USD',

  -- External calendar (Booking.com, Airbnb, etc.) iCal export URL for
  -- this specific property — platform varies per property/client, so
  -- this is intentionally not named after a specific platform.
  external_ical_url text,

  children_allowed boolean not null default true,
  pets_allowed boolean not null default false,
  amenities text[] not null default '{}',

  -- "Hide nightly price from visitors" toggle — fully wired end-to-end
  -- (admin UI, admin API, public properties API, BookingCalendar.tsx).
  hide_nightly_price boolean not null default false,

  created_at timestamptz not null default now()
);



-- ==========================
-- PROPERTY IMAGES
-- ==========================

create table property_images (
  id uuid primary key default gen_random_uuid(),

  property_id uuid not null
    references properties(id)
    on delete cascade,

  storage_path text not null,

  sort_order int not null default 0,

  created_at timestamptz not null default now()
);



-- ==========================
-- CALENDAR DAYS
-- ==========================
-- Cada fila representa una excepción/override sobre un día del calendario.
-- Si no existe una fila para una propiedad+fecha, ese día usa el precio
-- base y se rige por disponibilidad de iCal / reservas internas.

create table calendar_days (
  id uuid primary key default gen_random_uuid(),

  property_id uuid not null
    references properties(id)
    on delete cascade,

  date date not null,

  status text not null default 'available'
    check (status in ('available','blocked')),

  price numeric(10,2),

  min_stay int,

  updated_at timestamptz not null default now(),

  unique(property_id, date)
);



-- ==========================
-- RESERVATION REQUESTS
-- ==========================
-- No es pago. Es una solicitud que bloquea temporalmente fechas.
-- 'pending' reservations are currently authoritative and are never
-- auto-expired (expires_at exists but isn't set or checked anywhere in
-- the app) — freeing a pending reservation's dates is a manual admin
-- action (PATCH /api/admin/reservations/[id] -> status 'cancelled').

create table reservations (
  id uuid primary key default gen_random_uuid(),

  property_id uuid not null
    references properties(id)
    on delete cascade,

  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,

  start_date date not null,
  end_date date not null,

  total_price numeric(10,2),
  deposit_amount numeric(10,2),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'confirmed',
        'cancelled',
        'expired'
      )
    ),

  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Prevents two overlapping pending/confirmed reservations for the same
  -- property, at the database level — the app layer also checks this
  -- before inserting (for a fast, friendly error message), but this is
  -- the real backstop against the race condition where two near-
  -- simultaneous requests both pass that check before either inserts.
  exclude using gist (
    property_id with =,
    daterange(start_date, end_date, '[)') with &&
  )
  where (status in ('pending', 'confirmed'))
);



-- ==========================
-- INSTAGRAM POSTS
-- ==========================
-- Admin-curated gallery for the homepage Instagram section — replaces
-- what used to be a hardcoded array in InstagramGallery.tsx. Images live
-- in the same "property-images" Storage bucket, under an "instagram/"
-- prefix, rather than a separate bucket.

create table instagram_posts (
  id uuid primary key default gen_random_uuid(),
  image_storage_path text not null,
  -- The real Instagram post URL, opened when the tile is clicked.
  post_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);



-- ==========================
-- FAQS
-- ==========================
-- question/answer are localized: {"es": "...", "en"?: "...", "pt"?: "..."}
-- NOTE: the admin FAQ routes (app/api/admin/faqs) currently only ever
-- write the "es" key on create/update — there's no admin UI path to set
-- "en"/"pt" for a given FAQ. See TO_DO.md.

create table faqs (
  id uuid primary key default gen_random_uuid(),
  question jsonb not null,
  answer jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);



-- ==========================
-- SITE SETTINGS
-- ==========================
-- Singleton row (id = 'singleton') holding site-wide contact info, map
-- location, hero copy, email copy, and currency exchange rates. Not
-- present in the original schema.sql at all — added since.

create table site_settings (
  id text primary key default 'singleton',

  business_name text,
  -- Free text, rendered as separate lines split on newline — not
  -- necessarily the same as map_address below (that one's specifically
  -- the caption/link text shown next to the embedded map).
  business_address text,

  contact_whatsapp text,
  -- Separate from contact_whatsapp on purpose: some businesses use a
  -- different number for calls than for WhatsApp.
  contact_phone text,
  contact_email text,
  contact_instagram text not null default '',
  -- Stored as a full URL (unlike Instagram's handle-based normalization
  -- above) since Facebook page URLs don't follow as clean a pattern.
  contact_facebook text,

  map_latitude numeric,
  map_longitude numeric,
  map_address text,

  -- Localized: {"es": "...", "en"?: "...", "pt"?: "..."}
  hero_title jsonb,
  hero_subtitle jsonb,
  hero_button_text jsonb,
  hero_button_href text,

  about_title jsonb,
  about_text jsonb,

  email_subject text,
  email_intro text,

  default_property_price numeric,
  default_property_min_stay int,

  exchange_rate_uyu numeric not null default 42.5,
  exchange_rate_brl numeric not null default 5.4,

  updated_at timestamptz not null default now()
);


-- ==========================
-- REVIEWS
-- ==========================
-- text is localized: {"es": "...", "en"?: "...", "pt"?: "..."}
-- Follows the same shape as faqs.question / faqs.answer.

create table reviews (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  rating integer not null check (rating between 1 and 5),
  source text not null check (source in ('Google', 'Booking', 'Airbnb')),
  url text not null,
  text jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);



-- ==========================
-- FUNCTIONS
-- ==========================

-- Powers the group/bundle booking flow (app/api/reservations/group).
-- Inserts one reservations row per "leg" (one per property) for the same
-- guest, all inside a single implicit transaction — if any leg's insert
-- throws (most commonly reservations_no_overlap firing because another
-- booking beat it to that property/date range), the exception propagates
-- and every leg inserted so far in this call rolls back together. This
-- is what makes the group booking atomic: it's one function call, not a
-- sequence of separate inserts from the API route.
create or replace function create_group_reservation(
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_legs jsonb
)
returns setof reservations
language plpgsql
as $$
declare
  leg jsonb;
  new_reservation reservations;
begin
  for leg in select * from jsonb_array_elements(p_legs)
  loop
    insert into reservations (
      property_id, guest_name, guest_email, guest_phone,
      start_date, end_date, total_price, deposit_amount, status
    ) values (
      (leg->>'property_id')::uuid,
      p_guest_name,
      p_guest_email,
      p_guest_phone,
      (leg->>'start_date')::date,
      (leg->>'end_date')::date,
      (leg->>'total_price')::numeric,
      (leg->>'deposit_amount')::numeric,
      'pending'
    )
    returning * into new_reservation;

    return next new_reservation;
  end loop;
  return;
end;
$$;



-- ==========================
-- SECURITY
-- ==========================

alter table properties enable row level security;
alter table property_images enable row level security;
alter table instagram_posts enable row level security;
alter table calendar_days enable row level security;
alter table reservations enable row level security;
alter table faqs enable row level security;
alter table site_settings enable row level security;

-- No policies are defined here: every table is accessed exclusively via
-- supabaseAdmin (the service-role client) from server-side code, so RLS
-- being enabled with zero policies is intentional — it blocks any
-- accidental anon/client-side access rather than granting any.



-- ==========================
-- STORAGE
-- ==========================

insert into storage.buckets (
  id,
  name,
  public
)
values (
  'property-images',
  'property-images',
  true
)
on conflict (id) do nothing;


-- ==========================
-- CLEANUP FOR EXISTING DATABASES
-- ==========================
-- Run these separately against the live DB — they are NOT part of the
-- create-from-scratch schema above.
--
-- drop table if exists google_reviews_cache;
-- alter table properties rename column booking_ical_url to external_ical_url;