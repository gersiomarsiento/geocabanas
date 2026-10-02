// lib/commonAreas.ts
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getCommonAreaImages() {
  const { data } = await supabaseAdmin
    .from("common_area_images")
    .select("id, storage_path")
    .order("sort_order");

  return (data ?? []).map((r) => ({
    id: r.id,
    url: supabaseAdmin.storage
      .from("property-images")
      .getPublicUrl(r.storage_path).data.publicUrl,
  }));
}
