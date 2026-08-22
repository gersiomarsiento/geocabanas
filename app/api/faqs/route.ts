import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getLocalized } from "@/lib/i18n/getLocalized";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") ?? "es";

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
      question: getLocalized(faq.question, locale),
      answer: getLocalized(faq.answer, locale),
    })),
  );
}
