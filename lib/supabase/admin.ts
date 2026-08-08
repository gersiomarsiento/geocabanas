// Server-only. Uses the service role key, which bypasses Row Level
// Security entirely — never import this in a "use client" component or
// expose SUPABASE_SERVICE_ROLE_KEY to the browser.

 
import { createClient } from "@supabase/supabase-js";
 
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
);