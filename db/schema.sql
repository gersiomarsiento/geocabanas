-- Geocabañas CMS v1
-- Supabase schema

create extension if not exists "pgcrypto";


-- ==========================
-- PROPERTIES
-- ==========================

create table properties (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,

  description text,

  location text,
  address text,

  max_guests int,
  bedrooms int,
  bathrooms int,

  contact_email text,
  whatsapp text,

  default_min_stay int not null default 1,

  currency text not null default 'USD',

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
-- Cada fila representa un día del calendario.
-- Si no existe una fila, el día usa el precio base.

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
-- No es pago.
-- Es una solicitud que bloquea temporalmente fechas.

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

  created_at timestamptz not null default now()
);



-- ==========================
-- SECURITY
-- ==========================

alter table properties enable row level security;
alter table property_images enable row level security;
alter table calendar_days enable row level security;
alter table reservations enable row level security;



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
-- INITIAL PROPERTY
-- ==========================

insert into properties (
  name,
  slug,
  description,
  location,
  max_guests,
  bedrooms,
  bathrooms,
  contact_email,
  whatsapp,
  default_min_stay,
  currency
)
values (
  'Geocabañas - Punta del Diablo',
  'geocabanas',
  'Cabañas en Punta del Diablo',
  'Punta del Diablo, Uruguay',
  4,
  1,
  1,
  null,
  null,
  2,
  'USD'
);