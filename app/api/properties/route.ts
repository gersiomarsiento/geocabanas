// app/api/properties/route.ts
//
// Public — no admin auth needed, unlike /api/admin/properties. Only
// returns fields a visitor should see (no default_price/min_stay
// internals beyond what's needed for display, no ical URLs, etc.).

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select("id, name, slug, currency")
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las propiedades" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
