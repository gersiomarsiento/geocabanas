import { GET, POST } from "@/app/api/admin/instagram-posts/route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  cleanup,
  trackStoragePath,
  trackInstagramPostId,
} from "@/lib/testUtils/db";

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type });
}

function uploadRequest(file: File | null, postUrl: string | null): Request {
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (postUrl !== null) formData.append("postUrl", postUrl);
  return new Request("http://localhost/api/admin/instagram-posts", {
    method: "POST",
    body: formData,
  });
}

async function trackPost(id: string, imageStoragePath: string): Promise<void> {
  trackInstagramPostId(id);
  trackStoragePath(imageStoragePath);
}

afterEach(async () => {
  await cleanup();
});

describe("GET /api/admin/instagram-posts", () => {
  it("returns an empty array when there are no posts", async () => {
    const res = await GET();
    expect(await res.json()).toEqual([]);
  });
});

describe("POST /api/admin/instagram-posts — validation", () => {
  it("returns 400 when no file is provided", async () => {
    const res = await POST(uploadRequest(null, "https://instagram.com/p/abc"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when postUrl is missing", async () => {
    const res = await POST(
      uploadRequest(makeFile("a.jpg", "content", "image/jpeg"), null),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when postUrl is only whitespace", async () => {
    const res = await POST(
      uploadRequest(makeFile("a.jpg", "content", "image/jpeg"), "   "),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/instagram-posts — real upload", () => {
  it("uploads real bytes, creates a DB row, and trims postUrl", async () => {
    const res = await POST(
      uploadRequest(
        makeFile("post.jpg", "fake-instagram-bytes", "image/jpeg"),
        "  https://instagram.com/p/xyz  ",
      ),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.postUrl).toBe("https://instagram.com/p/xyz");
    expect(body.sortOrder).toBe(0);

    const { data: row } = await supabaseAdmin
      .from("instagram_posts")
      .select("image_storage_path")
      .eq("id", body.id)
      .single();
    await trackPost(body.id, row!.image_storage_path);

    const { data: downloaded, error } = await supabaseAdmin.storage
      .from("property-images")
      .download(row!.image_storage_path);
    expect(error).toBeNull();
    expect(await downloaded!.text()).toBe("fake-instagram-bytes");
  });

  it("increments sort_order across posts", async () => {
    const res1 = await POST(
      uploadRequest(
        makeFile("a.jpg", "one", "image/jpeg"),
        "https://instagram.com/p/1",
      ),
    );
    const body1 = await res1.json();
    const { data: row1 } = await supabaseAdmin
      .from("instagram_posts")
      .select("image_storage_path")
      .eq("id", body1.id)
      .single();
    await trackPost(body1.id, row1!.image_storage_path);
    expect(body1.sortOrder).toBe(0);

    const res2 = await POST(
      uploadRequest(
        makeFile("b.jpg", "two", "image/jpeg"),
        "https://instagram.com/p/2",
      ),
    );
    const body2 = await res2.json();
    const { data: row2 } = await supabaseAdmin
      .from("instagram_posts")
      .select("image_storage_path")
      .eq("id", body2.id)
      .single();
    await trackPost(body2.id, row2!.image_storage_path);
    expect(body2.sortOrder).toBe(1);
  });
});
