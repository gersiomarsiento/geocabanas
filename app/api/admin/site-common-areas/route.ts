// app/api/admin/common-areas/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "property-images";

const publicUrl = (path: string) =>
  supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("common_area_images")
    .select("id, storage_path, sort_order")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    data.map((r) => ({
      id: r.id,
      url: publicUrl(r.storage_path),
      sortOrder: r.sort_order,
    })),
  );
}

export async function POST(req: Request) {
  const file = (await req.formData()).get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "webp";
  const path = `common-areas/${randomUUID()}.${ext}`;

  const { error: upErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: last } = await supabaseAdmin
    .from("common_area_images")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (last?.sort_order ?? -1) + 1;

  const { data, error } = await supabaseAdmin
    .from("common_area_images")
    .insert({ storage_path: path, sort_order: sortOrder })
    .select("id")
    .single();
  if (error) {
    await supabaseAdmin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, url: publicUrl(path), sortOrder });
}