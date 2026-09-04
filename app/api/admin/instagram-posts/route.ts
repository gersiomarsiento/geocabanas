// app/api/admin/instagram-posts/route.ts
//
// GET  -> list all posts, ordered by sort_order
// POST -> upload a new post (multipart/form-data, fields "file" and "postUrl")
//
// Uses the "property-images" Storage bucket (under an "instagram/"
// prefix) and the instagram_posts table.

// TODO: gate this route behind your admin auth/session check before ship.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "property-images";

export async function GET() {
  const { data: posts, error } = await supabaseAdmin
    .from("instagram_posts")
    .select("id, image_storage_path, post_url, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const withUrls = posts.map((post) => ({
    id: post.id,
    postUrl: post.post_url,
    sortOrder: post.sort_order,
    url: supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(post.image_storage_path).data.publicUrl,
  }));

  return NextResponse.json(withUrls);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const postUrl = formData.get("postUrl");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  if (!postUrl || typeof postUrl !== "string" || !postUrl.trim()) {
    return NextResponse.json(
      { error: "Falta el link del posteo" },
      { status: 400 },
    );
  }

  const extension = file.name.split(".").pop() ?? "jpg";
  const storagePath = `instagram/${crypto.randomUUID()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json(
      { error: "No se pudo subir la imagen" },
      { status: 500 },
    );
  }

  const { count } = await supabaseAdmin
    .from("instagram_posts")
    .select("id", { count: "exact", head: true });

  const { data: post, error: insertError } = await supabaseAdmin
    .from("instagram_posts")
    .insert({
      image_storage_path: storagePath,
      post_url: postUrl.trim(),
      sort_order: count ?? 0,
    })
    .select("id, image_storage_path, post_url, sort_order")
    .single();

  if (insertError || !post) {
    // Clean up the uploaded file if the DB insert failed, so we don't
    // leave an orphaned object in the bucket with no record of it.
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: "No se pudo guardar el posteo" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: post.id,
    postUrl: post.post_url,
    sortOrder: post.sort_order,
    url: supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(post.image_storage_path).data.publicUrl,
  });
}
