// app/api/admin/faqs/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FaqCreate } from "@/types/faqs";

// TODO: gate this route behind your admin auth/session check before ship.
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
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sort_order,
    })),
  );
}

// TODO: gate this route behind your admin auth/session check before ship.
export async function POST(request: Request) {
  const body = (await request.json()) as FaqCreate;

  if (!body.question?.trim() || !body.answer?.trim()) {
    return NextResponse.json(
      { error: "Pregunta y respuesta son obligatorias" },
      { status: 400 },
    );
  }

  // New FAQs go at the end of the list by default.
  const { data: existing } = await supabaseAdmin
    .from("faqs")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data: faq, error } = await supabaseAdmin
    .from("faqs")
    .insert({
      question: body.question.trim(),
      answer: body.answer.trim(),
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
    question: faq.question,
    answer: faq.answer,
    sortOrder: faq.sort_order,
  });
}
