import { NextResponse } from "next/server";
import { getLocalized } from "@/lib/i18n/getLocalized";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ReviewCreate = {
  author: string;
  rating: number;
  source: string;
  url: string;
  text: string;
};

export async function GET() {
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

  return NextResponse.json(
    data.map((review) => ({
      id: review.id,
      author: review.author,
      rating: review.rating,
      source: review.source,
      url: review.url,
      text: getLocalized(review.text, "es"),
      sortOrder: review.sort_order,
    })),
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReviewCreate;

  if (
    !body.author?.trim() ||
    !body.rating ||
    !body.source ||
    !body.url?.trim() ||
    !body.text?.trim()
  ) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("reviews")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data: review, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      author: body.author.trim(),
      rating: body.rating,
      source: body.source,
      url: body.url.trim(),
      text: { es: body.text.trim() },
      sort_order: nextSortOrder,
    })
    .select("id, author, rating, source, url, text, sort_order")
    .single();

  if (error || !review) {
    return NextResponse.json(
      { error: error?.message ?? "No se pudo agregar la reseña" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: review.id,
    author: review.author,
    rating: review.rating,
    source: review.source,
    url: review.url,
    text: getLocalized(review.text, "es"),
    sortOrder: review.sort_order,
  });
}
