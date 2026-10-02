// app/api/admin/common-areas/reorder/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(req: Request) {
  const { order } = (await req.json()) as { order: string[] };

  const results = await Promise.all(
    order.map((id, i) =>
      supabaseAdmin
        .from("common_area_images")
        .update({ sort_order: i })
        .eq("id", id),
    ),
  );
  if (results.some((r) => r.error))
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
