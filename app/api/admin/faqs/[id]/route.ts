// app/api/admin/faqs/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getLocalized, type LocalizedText } from "@/lib/i18n/getLocalized";
import type { FaqUpdate } from "@/types/faqs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as FaqUpdate;

  const needsTextMerge = body.question != null || body.answer != null;

  let current: {
    question: LocalizedText | null;
    answer: LocalizedText | null;
  } = {
    question: null,
    answer: null,
  };
  if (needsTextMerge) {
    const { data } = await supabaseAdmin
      .from("faqs")
      .select("question, answer")
      .eq("id", id)
      .single();
    if (data) current = data;
  }

  const update: Record<string, unknown> = {};
  if (body.question != null) {
    update.question = { ...(current.question ?? {}), es: body.question.trim() };
  }
  if (body.answer != null) {
    update.answer = { ...(current.answer ?? {}), es: body.answer.trim() };
  }
  if (body.sortOrder != null) update.sort_order = body.sortOrder;

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No hay cambios para guardar" },
      { status: 400 },
    );
  }

  const { data: faq, error } = await supabaseAdmin
    .from("faqs")
    .update(update)
    .eq("id", id)
    .select("id, question, answer, sort_order")
    .single();

  if (error || !faq) {
    return NextResponse.json(
      { error: "Pregunta no encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: faq.id,
    question: getLocalized(faq.question, "es"),
    answer: getLocalized(faq.answer, "es"),
    sortOrder: faq.sort_order,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabaseAdmin.from("faqs").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
