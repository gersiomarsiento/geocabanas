import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("properties").select("*");

  return Response.json({
    data,
    error,
  });
}
