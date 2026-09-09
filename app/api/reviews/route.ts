import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Locale = "es" | "en" | "pt";

interface PublicReview {
  id: string;
  author: string;
  rating: number;
  source: "Google" | "Booking" | "Airbnb";
  url: string;
  text: string;
}

export async function GET(request: NextRequest) {
  const locale = (request.nextUrl.searchParams.get("locale") ?? "es") as Locale;

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, author, rating, source, url, text, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las reseñas" },
      { status: 500 },
    );
  }

  const reviews: PublicReview[] = (data ?? []).map((row) => ({
    id: row.id,
    author: row.author,
    rating: row.rating,
    source: row.source,
    url: row.url,
    text: row.text?.[locale] ?? row.text?.es ?? "",
  }));

  return NextResponse.json(reviews);
}
