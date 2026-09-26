import { PATCH } from "@/app/api/admin/site-settings/route";
import { supabaseAdmin } from "@/lib/supabase/admin";

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/site-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  // Restore the "no singleton row" state so tests don't leak into each
  // other or into other test files.
  await supabaseAdmin.from("site_settings").delete().eq("id", "singleton");
});

describe("PATCH /api/admin/site-settings — missing singleton row (current bug)", () => {
  it("returns ok:true even though nothing was actually persisted", async () => {
    // Confirm the starting state really has no row, so this test means
    // what it claims to mean.
    const { data: before } = await supabaseAdmin
      .from("site_settings")
      .select("id")
      .eq("id", "singleton")
      .maybeSingle();
    expect(before).toBeNull();

    const res = await PATCH(
      patchRequest({ businessName: "Should Not Persist" }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);

    const { data: after } = await supabaseAdmin
      .from("site_settings")
      .select("id")
      .eq("id", "singleton")
      .maybeSingle();

    // The bug: UPDATE on a nonexistent row succeeds silently, so no row
    // was ever created and nothing was actually saved.
    expect(after).toBeNull();
  });
});

describe("PATCH /api/admin/site-settings — with the singleton row seeded", () => {
  beforeEach(async () => {
    await supabaseAdmin.from("site_settings").insert({ id: "singleton" });
  });

  it("updates a plain field", async () => {
    const res = await PATCH(patchRequest({ businessName: "Nuevo Nombre" }));
    expect(res.status).toBe(200);

    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("business_name")
      .eq("id", "singleton")
      .single();
    expect(data?.business_name).toBe("Nuevo Nombre");
  });

  it("merges a localized field instead of overwriting other locales", async () => {
    await supabaseAdmin
      .from("site_settings")
      .update({ hero_title: { es: "Hola" } })
      .eq("id", "singleton");

    const res = await PATCH(patchRequest({ heroTitle: { en: "Hello" } }));
    expect(res.status).toBe(200);

    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("hero_title")
      .eq("id", "singleton")
      .single();
    expect(data?.hero_title).toEqual({ es: "Hola", en: "Hello" });
  });

  it("rejects a negative exchange rate", async () => {
    const res = await PATCH(patchRequest({ exchangeRateUyu: -5 }));
    expect(res.status).toBe(400);
  });

  it("rejects a non-numeric exchange rate", async () => {
    const res = await PATCH(patchRequest({ exchangeRateUyu: "abc" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when no recognized fields are provided", async () => {
    const res = await PATCH(patchRequest({ somethingUnrelated: true }));
    expect(res.status).toBe(400);
  });
});
