// Deliberately narrow: only cancels, nothing else. That matches your
// confirmed flow — ask, then cancel if confirmed — not a general editor.
//
// NOTE: using Promise-based params, matching your existing
// app/api/ical/[slug]/route.ts style. If your Next.js version doesn't
// need that (i.e. that file was the exception, not the rule), drop the
// `await params` and destructure `{ id }` directly from the param instead.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// TODO: gate this route behind your admin auth/session check before ship.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body?.status !== "cancelled") {
    return NextResponse.json(
      {
        error: "Esta ruta solo permite cancelar reservas (status: 'cancelled')",
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "No se pudo cancelar la reserva" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, reservation: data });
}
