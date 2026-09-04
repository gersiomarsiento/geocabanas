// app/api/admin/instagram-posts/[id]/route.ts
//
// PATCH  -> update the post's URL (no re-upload needed, e.g. fixing a typo)
// DELETE -> removes the post from both Storage and instagram_posts.
// Deliberately deletes the DB row first: if that fails, we haven't
// touched Storage yet. If Storage removal then fails, we're left with
// an orphaned file and no DB record pointing to it — annoying but
// harmless (nothing references it), versus a DB row pointing at a file
// that no longer exists, which would break rendering.

// TODO: gate this route behind your admin auth/session check before ship.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "property-images";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as { postUrl?: string };

  if (!body.postUrl || !body.postUrl.trim()) {
    return NextResponse.json(
      { error: "Falta el link del posteo" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("instagram_posts")
    .update({ post_url: body.postUrl.trim() })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar el posteo" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: post, error: fetchError } = await supabaseAdmin
    .from("instagram_posts")
    .select("id, image_storage_path")
    .eq("id", id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json(
      { error: "Posteo no encontrado" },
      { status: 404 },
    );
  }

  const { error: deleteRowError } = await supabaseAdmin
    .from("instagram_posts")
    .delete()
    .eq("id", id);

  if (deleteRowError) {
    return NextResponse.json(
      { error: "No se pudo eliminar el posteo" },
      { status: 500 },
    );
  }

  const { error: deleteFileError } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([post.image_storage_path]);

  if (deleteFileError) {
    console.error(
      "Failed to remove storage object after DB delete:",
      deleteFileError,
    );
  }

  return NextResponse.json({ ok: true });
}
