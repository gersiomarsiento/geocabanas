// app/api/properties/[id]/images/route.ts
//
// Public counterpart to app/api/admin/properties/[id]/images/route.ts.
// Read-only (no POST/DELETE here — those stay admin-only) and lives
// outside /api/admin/*, so middleware doesn't block visitors from it.

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
    url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(img.storage_path).data
      .publicUrl,
  }));

  return NextResponse.json(withUrls);
}
