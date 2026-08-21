// app/api/faqs/route.ts
//
// Public — no admin auth needed, unlike /api/admin/faqs. Read-only.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("faqs")
    .select("id, question, answer, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las preguntas frecuentes" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    data.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
    })),
  );
}
