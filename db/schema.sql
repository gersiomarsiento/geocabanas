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

  -- Per-property Booking.com iCal export URL (not a shared env var).
  booking_ical_url text,

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
  updated_at timestamptz not null default now()
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

  contact_whatsapp text,
  contact_email text,
  contact_instagram text not null default '',

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
-- SECURITY
-- ==========================

alter table properties enable row level security;
alter table property_images enable row level security;
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
