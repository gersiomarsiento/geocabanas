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

describe("PATCH /api/admin/site-settings — missing singleton row (fixed via upsert)", () => {
  it("creates the singleton row on first save instead of silently no-oping", async () => {
    const { data: before } = await supabaseAdmin
      .from("site_settings")
      .select("id")
      .eq("id", "singleton")
      .maybeSingle();
    expect(before).toBeNull();

    const res = await PATCH(patchRequest({ businessName: "First Ever Save" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);

    const { data: after } = await supabaseAdmin
      .from("site_settings")
      .select("id, business_name")
      .eq("id", "singleton")
      .maybeSingle();

    expect(after).not.toBeNull();
    expect(after?.business_name).toBe("First Ever Save");
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
