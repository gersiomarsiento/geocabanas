import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(
      `
      id,
      name,
      default_price,
      default_min_stay,
      min_reservation_fee,
      hide_nightly_price,
      currency,
      bedrooms,
      bathrooms,
      max_guests,
      children_allowed,
      pets_allowed,
      amenities
    `,
    )
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const properties = data.map((property) => ({
    id: property.id,
    name: property.name,
    defaultPrice: Number(property.default_price),
    defaultMinStay: property.default_min_stay,
    minReservationFee: Number(property.min_reservation_fee),
    hideNightlyPrice: property.hide_nightly_price,
    currency: property.currency,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.max_guests,
    childrenAllowed: property.children_allowed,
    petsAllowed: property.pets_allowed,
    amenities: property.amenities ?? [],
  }));

  return NextResponse.json(properties);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  }

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 0;

  // If the slug's taken, append a short random suffix instead of asking
  // the admin to type one manually — keeps "add property" a one-field action.
  while (attempt < 5) {
    const { data: existing } = await supabaseAdmin
      .from("properties")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data: siteDefaults } = await supabaseAdmin
    .from("site_settings")
    .select("default_property_price, default_property_min_stay")
    .eq("id", "singleton")
    .single();

  const defaultPrice = siteDefaults?.default_property_price ?? 0;
  const defaultMinStay = siteDefaults?.default_property_min_stay ?? 1;

  const { data: property, error } = await supabaseAdmin
    .from("properties")
    .insert({
      name,
      slug,
      default_price: defaultPrice,
      default_min_stay: defaultMinStay,
      min_reservation_fee: 0,
      hide_nightly_price: false,
      children_allowed: true,
      pets_allowed: false,
      amenities: [],
      currency: "UYU",
    })
    .select("*") // grab everything — see note below on shaping the response
    .single();

  if (error || !property) {
    return NextResponse.json(
      { error: "No se pudo crear la propiedad" },
      { status: 500 },
    );
  }
  return NextResponse.json({
    id: property.id,
    name: property.name,
    defaultPrice: Number(property.default_price),
    defaultMinStay: property.default_min_stay,
    minReservationFee: Number(property.min_reservation_fee),
    hideNightlyPrice: property.hide_nightly_price,
    currency: property.currency,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.max_guests,
    childrenAllowed: property.children_allowed,
    petsAllowed: property.pets_allowed,
    amenities: property.amenities ?? [],
  });
}
