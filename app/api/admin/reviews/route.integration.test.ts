import { GET, POST } from "@/app/api/admin/reviews/route";
import { cleanup, trackReviewId } from "@/lib/testUtils/db";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validReview = {
  author: "Ana",
  rating: 5,
  source: "Google",
  url: "https://google.com/review/1",
  text: "Excelente lugar",
};

afterEach(async () => {
  await cleanup();
});

describe("GET /api/admin/reviews", () => {
  it("returns an empty array when there are none", async () => {
    const res = await GET();
    expect(await res.json()).toEqual([]);
  });
});

describe("POST /api/admin/reviews — validation", () => {
  it("returns 400 when a required field is missing", async () => {
    const res = await POST(postRequest({ ...validReview, author: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when rating is 0/missing", async () => {
    const res = await POST(postRequest({ ...validReview, rating: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns a clean 400 for an out-of-range rating (fixed — used to be a raw 500)", async () => {
    const res = await POST(postRequest({ ...validReview, rating: 6 }));
    expect(res.status).toBe(400);
  });

  it("returns a clean 400 for a source outside the allowed set (fixed — used to be a raw 500)", async () => {
    const res = await POST(postRequest({ ...validReview, source: "Yelp" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/reviews — creation", () => {
  it("creates a review and returns the es-projected text", async () => {
    const res = await POST(postRequest(validReview));
    const body = await res.json();
    trackReviewId(body.id);

    expect(res.status).toBe(200);
    expect(body.author).toBe("Ana");
    expect(body.text).toBe("Excelente lugar");
    expect(body.sortOrder).toBe(0);
  });
});
