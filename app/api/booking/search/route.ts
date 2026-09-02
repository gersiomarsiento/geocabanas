// app/api/booking/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRangeAvailability } from "@/lib/booking/availability";
import { BASE_CURRENCY } from "@/lib/currency";

const MAX_COMBO_SIZE = 4;

interface Candidate {
  id: string;
  name: string;
  slug: string;
  maxGuests: number;
  bedrooms: number;
  childrenAllowed: boolean;
  petsAllowed: boolean;
  totalPrice: number;
}

function* combinations<T>(items: T[], size: number): Generator<T[]> {
  if (size === 0) {
    yield [];
    return;
  }
  for (let i = 0; i <= items.length - size; i++) {
    for (const rest of combinations(items.slice(i + 1), size - 1)) {
      yield [items[i], ...rest];
    }
  }
}

function findMatches(
  eligible: Candidate[],
  guests: number,
  bedroomsWanted: number | null,
) {
  const singles = eligible
    .filter(
      (p) =>
        p.maxGuests >= guests &&
        (bedroomsWanted == null || p.bedrooms >= bedroomsWanted),
    )
    .sort((a, b) => a.totalPrice - b.totalPrice);

  const combos: {
    properties: Candidate[];
    totalPrice: number;
    totalMaxGuests: number;
    totalBedrooms: number;
  }[] = [];

  if (singles.length === 0) {
    for (
      let size = 2;
      size <= Math.min(MAX_COMBO_SIZE, eligible.length);
      size++
    ) {
      for (const combo of combinations(eligible, size)) {
        const totalMaxGuests = combo.reduce((s, p) => s + p.maxGuests, 0);
        const totalBedrooms = combo.reduce((s, p) => s + p.bedrooms, 0);

        if (totalMaxGuests < guests) continue;
        if (bedroomsWanted != null && totalBedrooms < bedroomsWanted) continue;

        combos.push({
          properties: combo,
          totalPrice: combo.reduce((s, p) => s + p.totalPrice, 0),
          totalMaxGuests,
          totalBedrooms,
        });
      }
      if (combos.length > 0) break; // ya encontramos combos del tamaño mínimo posible
    }
    combos.sort((a, b) => a.totalPrice - b.totalPrice);
  }

  return { singles, combos: combos.slice(0, 5) };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const guests = Number(searchParams.get("guests"));
  const bedroomsWanted = searchParams.get("bedrooms")
    ? Number(searchParams.get("bedrooms"))
    : null;
  const needsChildrenAllowed = searchParams.get("children") === "true";
  const needsPetsAllowed = searchParams.get("pets") === "true";

  if (!startDate || !endDate || !guests || guests < 1) {
    return NextResponse.json(
      { error: "Faltan parámetros de búsqueda" },
      { status: 400 },
    );
  }

  if (startDate >= endDate) {
    return NextResponse.json(
      { error: "El rango de fechas es inválido" },
      { status: 400 },
    );
  }

  const { data: properties, error } = await supabaseAdmin
    .from("properties")
    .select(
      "id, name, slug, max_guests, bedrooms, children_allowed, pets_allowed",
    );

  if (error || !properties) {
    return NextResponse.json(
      { error: "No se pudieron cargar las propiedades" },
      { status: 500 },
    );
  }

  const results = await Promise.all(
    properties.map(async (property) => {
      try {
        const availability = await getRangeAvailability(
          property.id,
          startDate,
          endDate,
        );
        return { property, availability };
      } catch {
        return null;
      }
    }),
  );

  const eligible: Candidate[] = results
    .filter(
      (entry): entry is NonNullable<typeof entry> =>
        entry !== null &&
        entry.availability.available &&
        entry.availability.minStayOk,
    )
    .map(({ property, availability }) => ({
      id: property.id,
      name: property.name,
      slug: property.slug,
      maxGuests: property.max_guests ?? 0,
      bedrooms: property.bedrooms ?? 0,
      childrenAllowed: property.children_allowed ?? false,
      petsAllowed: property.pets_allowed ?? false,
      totalPrice: availability.totalPrice,
    }))
    .filter((p) => !needsChildrenAllowed || p.childrenAllowed)
    .filter((p) => !needsPetsAllowed || p.petsAllowed);

  let bedroomsRelaxed = false;
  let { singles, combos } = findMatches(eligible, guests, bedroomsWanted);

  if (bedroomsWanted != null && singles.length === 0 && combos.length === 0) {
    ({ singles, combos } = findMatches(eligible, guests, null));
    bedroomsRelaxed = true;
  }

  const toPublic = (p: Candidate) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    maxGuests: p.maxGuests,
    bedrooms: p.bedrooms,
    totalPrice: p.totalPrice,
  });

  return NextResponse.json({
    currency: BASE_CURRENCY,
    bedroomsRelaxed,
    singles: singles.map(toPublic),
    combos: combos.map((c) => ({
      properties: c.properties.map(toPublic),
      totalPrice: c.totalPrice,
      totalMaxGuests: c.totalMaxGuests,
      totalBedrooms: c.totalBedrooms,
    })),
  });
}
