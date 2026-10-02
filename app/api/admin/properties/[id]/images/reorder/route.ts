// app/api/admin/properties/[id]/images/reorder/route.ts

import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";

// No per-route auth check needed: this lives under /api/admin/*, which the
// middleware already blocks for non-admins.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: propertyId } = await params;
  const body = await req.json().catch(() => null);
  const order: unknown = body?.order;

  if (
    !Array.isArray(order) ||
    order.length === 0 ||
    !order.every((x) => typeof x === "string")
  ) {
    return NextResponse.json({ error: "Orden inválido" }, { status: 400 });
  }

  // One UPDATE per image. Not an upsert: upsert would trip the NOT NULL
  // on storage_path before it ever reaches the conflict clause.
  // Scoping by property_id stops one property's request from touching
  // another property's rows.
  const results = await Promise.all(
    (order as string[]).map((imageId, index) =>
      supabaseAdmin
        .from("property_images")
        .update({ sort_order: index })
        .eq("id", imageId)
        .eq("property_id", propertyId),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return NextResponse.json(
      { error: "No se pudo guardar el orden" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}