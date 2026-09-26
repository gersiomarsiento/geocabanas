import { GET, POST } from "@/app/api/admin/properties/[id]/images/route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createTestProperty,
  cleanup,
  trackStoragePath,
} from "@/lib/testUtils/db";

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type });
}

function uploadRequest(file: File | null): Request {
  const formData = new FormData();

  if (file) formData.append("file", file);
  return new Request("http://localhost/api/admin/properties/x/images", {
    method: "POST",
    body: formData,
  });
}

function callGET(id: string) {
  return GET(new Request("http://localhost/x"), {
    params: Promise.resolve({ id }),
  });
}

function callPOST(id: string, file: File | null) {
  return POST(uploadRequest(file), { params: Promise.resolve({ id }) });
}

async function trackByImageId(imageId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("property_images")
    .select("storage_path")
    .eq("id", imageId)
    .single();
  trackStoragePath(data!.storage_path);
  return data!.storage_path;
}

afterEach(async () => {
  await cleanup();
});

describe("GET .../images", () => {
  it("returns an empty array when the property has no images", async () => {
    const propertyId = await createTestProperty({});
    const res = await callGET(propertyId);
    expect(await res.json()).toEqual([]);
  });

  it("returns images ordered by sort_order with working public URLs", async () => {
    const propertyId = await createTestProperty({});
    const first = await callPOST(
      propertyId,
      makeFile("a.jpg", "one", "image/jpeg"),
    );
    const firstBody = await first.json();
    await trackByImageId(firstBody.id);

    const second = await callPOST(
      propertyId,
      makeFile("b.jpg", "two", "image/jpeg"),
    );
    const secondBody = await second.json();
    await trackByImageId(secondBody.id);

    const res = await callGET(propertyId);
    const body = await res.json();

    expect(body).toHaveLength(2);
    expect(body[0].sortOrder).toBe(0);
    expect(body[1].sortOrder).toBe(1);
    expect(body[0].url).toContain("property-images");
  });
});

describe("POST .../images — validation", () => {
  it("returns 400 when no file is provided", async () => {
    const propertyId = await createTestProperty({});
    const res = await callPOST(propertyId, null);
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown property", async () => {
    const res = await callPOST(
      "00000000-0000-0000-0000-000000000000",
      makeFile("a.jpg", "content", "image/jpeg"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for a disallowed MIME type", async () => {
    const propertyId = await createTestProperty({});
    const res = await callPOST(
      propertyId,
      makeFile("doc.pdf", "content", "application/pdf"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for a file over the size cap", async () => {
    const propertyId = await createTestProperty({});
    const bigContent = "x".repeat(10 * 1024 * 1024 + 1);
    const res = await callPOST(
      propertyId,
      makeFile("big.jpg", bigContent, "image/jpeg"),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST .../images — real upload", () => {
  it("uploads real bytes to Storage and creates a matching DB row", async () => {
    const propertyId = await createTestProperty({});
    const res = await callPOST(
      propertyId,
      makeFile("photo.jpg", "fake-image-bytes", "image/jpeg"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sortOrder).toBe(0);

    const storagePath = await trackByImageId(body.id);

    const { data: downloaded, error } = await supabaseAdmin.storage
      .from("property-images")
      .download(storagePath);
    expect(error).toBeNull();

    const text = await downloaded!.text();
    expect(text).toBe("fake-image-bytes");
  });

  it("increments sort_order across successive uploads for the same property", async () => {
    const propertyId = await createTestProperty({});

    const res1 = await callPOST(
      propertyId,
      makeFile("a.jpg", "one", "image/jpeg"),
    );
    const body1 = await res1.json();
    await trackByImageId(body1.id);
    expect(body1.sortOrder).toBe(0);

    const res2 = await callPOST(
      propertyId,
      makeFile("b.jpg", "two", "image/jpeg"),
    );
    const body2 = await res2.json();
    await trackByImageId(body2.id);
    expect(body2.sortOrder).toBe(1);
  });
});
