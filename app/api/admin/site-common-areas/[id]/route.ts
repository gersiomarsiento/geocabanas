// app/api/admin/common-areas/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from("common_area_images")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabaseAdmin.storage.from("property-images").remove([row.storage_path]);
  const { error } = await supabaseAdmin
    .from("common_area_images")
    .delete()
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}