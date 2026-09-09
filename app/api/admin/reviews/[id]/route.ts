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
    update.rating = body.rating;
  }

  if (body.source != null) {
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

  if (error || !review) {
    return NextResponse.json(
      { error: "Reseña no encontrada" },
      { status: 404 },
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

  const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
