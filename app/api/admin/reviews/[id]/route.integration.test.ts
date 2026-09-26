import { PATCH, DELETE } from "@/app/api/admin/reviews/[id]/route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createTestReview, cleanup } from "@/lib/testUtils/db";

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/reviews/x", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function callPatch(id: string, body: unknown) {
  return PATCH(patchRequest(body), { params: Promise.resolve({ id }) });
}

function callDelete(id: string) {
  return DELETE(new Request("http://localhost/api/admin/reviews/x"), {
    params: Promise.resolve({ id }),
  });
}

afterEach(async () => {
  await cleanup();
});

describe("PATCH /api/admin/reviews/[id] — validation", () => {
  it("returns 400 when no recognized fields are provided", async () => {
    const reviewId = await createTestReview();
    const res = await callPatch(reviewId, {});
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/admin/reviews/[id] — updates", () => {
  it("updates a plain field", async () => {
    const reviewId = await createTestReview({ author: "Original" });
    const res = await callPatch(reviewId, { author: "Actualizado" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.author).toBe("Actualizado");
  });

  it("merges text, preserving other locales", async () => {
    const reviewId = await createTestReview({
      text: { es: "Hola", en: "Hello" },
    });

    const res = await callPatch(reviewId, { text: { en: "Hi there" } });
    expect(res.status).toBe(200);

    const { data } = await supabaseAdmin
      .from("reviews")
      .select("text")
      .eq("id", reviewId)
      .single();
    expect(data?.text).toEqual({ es: "Hola", en: "Hi there" });
  });
});

describe("PATCH /api/admin/reviews/[id] — distinguishing not-found from a real error", () => {
  it("returns 404 for a genuinely nonexistent id", async () => {
    const res = await callPatch("00000000-0000-0000-0000-000000000000", {
      author: "Nuevo",
    });
    expect(res.status).toBe(404);
  });

  it("returns a clean 400 for a real constraint violation, caught before hitting the DB (fixed twice over)", async () => {
    const reviewId = await createTestReview();
    const res = await callPatch(reviewId, { rating: 99 });
    expect(res.status).toBe(400);

    const { data } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("id", reviewId)
      .maybeSingle();
    expect(data).not.toBeNull();
  });
});

describe("DELETE /api/admin/reviews/[id]", () => {
  it("deletes an existing review", async () => {
    const reviewId = await createTestReview();
    const res = await callDelete(reviewId);
    expect(res.status).toBe(200);

    const { data } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("id", reviewId)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("returns 404 for an id that was never there (fixed — used to silently succeed)", async () => {
    const res = await callDelete("00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });
});
