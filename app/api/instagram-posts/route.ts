// app/api/instagram-posts/route.ts
//
// Public read of the admin-curated Instagram gallery.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "property-images";

export async function GET() {
  const { data: posts, error } = await supabaseAdmin
    .from("instagram_posts")
    .select("id, image_storage_path, post_url, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !posts) {
    return NextResponse.json({ error: "No se pudo cargar" }, { status: 500 });
  }

  return NextResponse.json(
    posts.map((post) => ({
      id: post.id,
      postUrl: post.post_url,
      url: supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(post.image_storage_path).data.publicUrl,
    })),
  );
}
