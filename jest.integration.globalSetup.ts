import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvTest(): void {
  const envPath = join(__dirname, ".env.test");
  const content = readFileSync(envPath, "utf-8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

export default async function globalSetup(): Promise<void> {
  loadEnvTest();

  const url = process.env.SUPABASE_URL ?? "";

  // Hard safety guard: this script does unfiltered bulk deletes. Never
  // let it run against anything that isn't obviously the local Docker
  // instance, no matter what .env.test happens to contain.
  if (!url.includes("127.0.0.1") && !url.includes("localhost")) {
    throw new Error(
      `Refusing to reset the test DB: SUPABASE_URL ("${url}") doesn't look local. ` +
        `Integration tests must never run against a real Supabase project.`,
    );
  }

  const supabaseAdmin = createClient(
    url,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  // properties cascades (ON DELETE CASCADE) to calendar_days,
  // reservations, and property_images, so clearing it alone covers
  // those. faqs has no FK relationship to properties, so it needs its
  // own clear. Add further tables here if test helpers start covering
  // them (e.g. reviews, instagram_posts).
  const tables = ["properties", "faqs", "reviews"];

  for (const table of tables) {
    const { error } = await supabaseAdmin
      .from(table)
      // PostgREST refuses an unfiltered delete, so this "not equal to an
      // id that can never exist" filter is the standard way to say
      // "delete every row."
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      throw new Error(
        `globalSetup: failed to clear "${table}": ${error.message}`,
      );
    }
  }
  const { error: settingsError } = await supabaseAdmin
    .from("site_settings")
    .delete()
    .eq("id", "singleton");
  if (settingsError) {
    throw new Error(`globalSetup: failed to clear "site_settings": ${settingsError.message}`);
  }
}
