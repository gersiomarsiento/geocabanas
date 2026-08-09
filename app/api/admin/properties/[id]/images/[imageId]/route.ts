// app/api/admin/properties/[id]/images/[imageId]/route.ts
//
// DELETE -> removes the image from both Storage and property_images.
// Deliberately deletes the DB row first: if that fails, we haven't
// touched Storage yet. If Storage removal then fails, we're left with
// an orphaned file and no DB record pointing to it — annoying but
// harmless (nothing references it), versus a DB row pointing at a file
// that no longer exists, which would break rendering.

// TODO: gate this route behind your admin auth/session check before ship.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "property-images";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const { id: propertyId, imageId } = await params;

  const { data: image, error: fetchError } = await supabaseAdmin
    .from("property_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .eq("property_id", propertyId)
    .single();

  if (fetchError || !image) {
    return NextResponse.json(
      { error: "Imagen no encontrada" },
      { status: 404 },
    );
  }

  const { error: deleteRowError } = await supabaseAdmin
    .from("property_images")
    .delete()
    .eq("id", imageId);

  if (deleteRowError) {
    return NextResponse.json(
      { error: "No se pudo eliminar la imagen" },
      { status: 500 },
    );
  }

  const { error: deleteFileError } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([image.storage_path]);

  if (deleteFileError) {
    // The DB row is already gone, so the gallery will look correct even
    // though the file itself is still sitting in the bucket. Log it so
    // it's not a total mystery later if storage usage looks off.
    console.error(
      "Failed to remove storage object after DB delete:",
      deleteFileError,
    );
  }

  return NextResponse.json({ ok: true });
}
