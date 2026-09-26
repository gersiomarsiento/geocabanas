import { GET, POST } from "@/app/api/admin/properties/route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createTestProperty, trackPropertyId, cleanup } from "@/lib/testUtils/db";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function getSlugFor(propertyId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("properties")
    .select("slug")
    .eq("id", propertyId)
    .single();
  return data!.slug;
}

afterEach(async () => {
  await cleanup();
  await supabaseAdmin.from("site_settings").delete().eq("id", "singleton");
  jest.restoreAllMocks();
});

describe("GET /api/admin/properties", () => {
  it("returns an empty array when there are none", async () => {
    const res = await GET();
    expect(await res.json()).toEqual([]);
  });

  it("returns created properties with the expected shape", async () => {
    await createTestProperty({ name: "Cabaña Test", default_price: 100 });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Cabaña Test");
    expect(body[0].defaultPrice).toBe(100);
    expect(body[0].currency).toBe("USD");
  });
});

describe("POST /api/admin/properties — validation", () => {
  it("returns 400 when name is missing", async () => {
    const res = await POST(postRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is only whitespace", async () => {
    const res = await POST(postRequest({ name: "   " }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/properties — creation defaults", () => {
  it("falls back to price 0 / min stay 1 when site_settings has no singleton row", async () => {
    const res = await POST(postRequest({ name: "Sin Configuración" }));
    const body = await res.json();
    trackPropertyId(body.id);

    expect(res.status).toBe(200);
    expect(body.defaultPrice).toBe(0);
    expect(body.defaultMinStay).toBe(1);
  });

  it("uses site_settings defaults when the singleton row is seeded", async () => {
    await supabaseAdmin.from("site_settings").insert({
      id: "singleton",
      default_property_price: 85,
      default_property_min_stay: 2,
    });

    const res = await POST(postRequest({ name: "Con Configuración" }));
    const body = await res.json();
    trackPropertyId(body.id);


    expect(body.defaultPrice).toBe(85);
    expect(body.defaultMinStay).toBe(2);
  });
});

describe("POST /api/admin/properties — slug generation", () => {
  it("generates a differently-suffixed slug when the base slug is already taken", async () => {
    await createTestProperty({ name: "Casa del Sol", slug: "casa-del-sol" });

    const res = await POST(postRequest({ name: "Casa del Sol" }));
    const body = await res.json();
    trackPropertyId(body.id);
    expect(res.status).toBe(200);

    const slug = await getSlugFor(body.id);
    expect(slug).not.toBe("casa-del-sol");
    expect(slug).toMatch(/^casa-del-sol-[a-z0-9]{4}$/);
  });

  it("returns a clean 409 instead of a raw 500 when all 5 retry attempts collide (fixed edge case)", async () => {
    // Force every "random" suffix to be identical, so every retry
    // attempt collides with the same pre-seeded row.
    jest.spyOn(Math, "random").mockReturnValue(0.123456);
    const forcedSuffix = (0.123456).toString(36).slice(2, 6);

    await createTestProperty({ name: "Casa Colisión", slug: "casa-colision" });
    await createTestProperty({
      name: "Casa Colisión Suffix",
      slug: `casa-colision-${forcedSuffix}`,
    });

    const res = await POST(postRequest({ name: "Casa Colisión" }));

    expect(res.status).toBe(409);
  });
});
