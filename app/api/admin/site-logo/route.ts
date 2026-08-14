import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "property-images";
const LOGO_PATH = "site/logo";

// TODO: gate this route behind your admin auth/session check before ship.
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(LOGO_PATH, arrayBuffer, { contentType: file.type, upsert: true });
  if (error) {
    return NextResponse.json(
      { error: "No se pudo subir el logo" },
      { status: 500 },
    );
  }
  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(LOGO_PATH);
  return NextResponse.json({
    ok: true,
    logoUrl: `${urlData.publicUrl}?v=${Date.now()}`,
  });
}
