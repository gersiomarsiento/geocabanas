// app/api/admin/site-hero/route.ts
//
// POST -> uploads a new hero image, overwriting whatever was there
// before (upsert: true). No DB row involved — see app/api/site-settings/route.ts.

// TODO: gate this route behind your admin auth/session check before ship.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "property-images";
const HERO_PATH = "site/hero";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(HERO_PATH, arrayBuffer, { contentType: file.type, upsert: true });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo subir la imagen" },
      { status: 500 },
    );
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(HERO_PATH);

  return NextResponse.json({
    ok: true,
    heroUrl: `${urlData.publicUrl}?v=${Date.now()}`,
  });
}
