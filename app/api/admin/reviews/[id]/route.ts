import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getLocalized, type LocalizedText } from "@/lib/i18n/getLocalized";

import type { ReviewUpdate } from "@/types/reviews";

type LocalizedFieldUpdate = Partial<Record<"es" | "en" | "pt", string>>;

function pickLocales(value: LocalizedFieldUpdate): LocalizedFieldUpdate {
  const result: LocalizedFieldUpdate = {};
  for (const locale of ["es", "en", "pt"] as const) {
    if (value[locale] != null) result[locale] = value[locale];
  }
  return result;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as ReviewUpdate;

  const needsTextMerge = body.text != null;

  let current: {
    text: LocalizedText | null;
  } = {
    text: null,
  };

  if (needsTextMerge) {
    const { data } = await supabaseAdmin
      .from("reviews")
      .select("text")
      .eq("id", id)
      .single();

    if (data) current = data;
  }

  const update: Record<string, unknown> = {};

  if (body.author != null) {
    update.author = body.author.trim();
  }

  if (body.rating != null) {
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "La calificación debe ser un número entero entre 1 y 5" },
        { status: 400 },
      );
    }
    update.rating = body.rating;
  }

  if (body.source != null) {
    const ALLOWED_SOURCES = ["Google", "Booking", "Airbnb"];
    if (!ALLOWED_SOURCES.includes(body.source)) {
      return NextResponse.json(
        { error: "La fuente debe ser Google, Booking o Airbnb" },
        { status: 400 },
      );
    }
    update.source = body.source;
  }

  if (body.url != null) {
    update.url = body.url.trim();
  }

  if (body.text != null) {
    update.text = {
      ...(current.text ?? {}),
      ...pickLocales(body.text),
    };
  }

  if (body.sortOrder != null) {
    update.sort_order = body.sortOrder;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No hay cambios para guardar" },
      { status: 400 },
    );
  }

  const { data: review, error } = await supabaseAdmin
    .from("reviews")
    .update(update)
    .eq("id", id)
    .select("id, author, rating, source, url, text, sort_order")
    .single();

  if (error?.code === "PGRST116") {
    // .single() found zero matching rows — genuinely no such review.
    return NextResponse.json(
      { error: "Reseña no encontrada" },
      { status: 404 },
    );
  }

  if (error || !review) {
    // A real error (e.g. a constraint violation on rating/source), not
    // a missing row — was previously misreported as 404 too.
    return NextResponse.json(
      { error: error?.message ?? "No se pudo actualizar la reseña" },
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    // DELETE matching zero rows isn't a Postgres error, so without this
    // check, deleting an id that was never there would silently
    // succeed too.
    return NextResponse.json(
      { error: "Reseña no encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
