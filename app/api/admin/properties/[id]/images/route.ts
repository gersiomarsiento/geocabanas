// app/api/admin/properties/[id]/images/route.ts
//
// GET  -> list this property's images, ordered by sort_order
// POST -> upload a new image (multipart/form-data, field name "file")
//
// Uses the "property-images" Storage bucket and property_images table
// set up in the original schema migration.

// TODO: gate this route behind your admin auth/session check before ship.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "property-images";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: propertyId } = await params;

  const { data: images, error } = await supabaseAdmin
    .from("property_images")
    .select("id, storage_path, sort_order")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const withUrls = images.map((img) => ({
    id: img.id,
    sortOrder: img.sort_order,
    url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(img.storage_path).data.publicUrl,
  }));

  return NextResponse.json(withUrls);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: propertyId } = await params;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const { data: property, error: propertyError } = await supabaseAdmin
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .single();

  if (propertyError || !property) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }

  const extension = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${propertyId}/${crypto.randomUUID()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: "No se pudo subir la imagen" }, { status: 500 });
  }

  const { count } = await supabaseAdmin
    .from("property_images")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  const { data: image, error: insertError } = await supabaseAdmin
    .from("property_images")
    .insert({
      property_id: propertyId,
      storage_path: storagePath,
      sort_order: count ?? 0,
    })
    .select("id, storage_path, sort_order")
    .single();

  if (insertError || !image) {
    // Clean up the uploaded file if the DB insert failed, so we don't
    // leave an orphaned object in the bucket with no record of it.
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "No se pudo guardar la imagen" }, { status: 500 });
  }

  return NextResponse.json({
    id: image.id,
    sortOrder: image.sort_order,
    url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(image.storage_path).data.publicUrl,
  });
}