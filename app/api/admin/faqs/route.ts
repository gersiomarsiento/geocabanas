// app/api/admin/faqs/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getLocalized } from "@/lib/i18n/getLocalized";
import type { FaqCreate } from "@/types/faqs";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("faqs")
    .select("id, question, answer, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    data.map((faq) => ({
      id: faq.id,
      question: getLocalized(faq.question, "es"),
      answer: getLocalized(faq.answer, "es"),
      sortOrder: faq.sort_order,
    })),
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as FaqCreate;

  if (!body.question?.trim() || !body.answer?.trim()) {
    return NextResponse.json(
      { error: "Pregunta y respuesta son obligatorias" },
      { status: 400 },
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("faqs")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data: faq, error } = await supabaseAdmin
    .from("faqs")
    .insert({
      question: { es: body.question.trim() },
      answer: { es: body.answer.trim() },
      sort_order: nextSortOrder,
    })
    .select("id, question, answer, sort_order")
    .single();

  if (error || !faq) {
    return NextResponse.json(
      { error: error?.message ?? "No se pudo crear la pregunta" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: faq.id,
    question: getLocalized(faq.question, "es"),
    answer: getLocalized(faq.answer, "es"),
    sortOrder: faq.sort_order,
  });
}
