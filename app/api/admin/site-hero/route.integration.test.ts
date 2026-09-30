import { POST } from "@/app/api/admin/site-hero/route";
import { supabaseAdmin } from "@/lib/supabase/admin";

const HERO_PATH = "site/hero";

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type });
}

function uploadRequest(file: File | null): Request {
  const formData = new FormData();
  if (file) formData.append("file", file);
  return new Request("http://localhost/api/admin/site-hero", {
    method: "POST",
    body: formData,
  });
}

afterEach(async () => {
  await supabaseAdmin.storage.from("property-images").remove([HERO_PATH]);
});

describe("POST /api/admin/site-hero — validation", () => {
  it("returns 400 when no file is provided", async () => {
    const res = await POST(uploadRequest(null));
    expect(res.status).toBe(400);
  });
  
  it("returns 400 for a disallowed MIME type", async () => {
    const res = await POST(uploadRequest(makeFile("doc.pdf", "content", "application/pdf")));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/site-hero — real upload", () => {
  it("uploads real bytes to the fixed site/hero path and includes a cache-busting query param", async () => {
    const res = await POST(
      uploadRequest(makeFile("hero.webp", "hero-image-bytes", "image/jpeg")),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.heroUrl).toContain("?v=");

    const { data: downloaded, error } = await supabaseAdmin.storage
      .from("property-images")
      .download(HERO_PATH);
    expect(error).toBeNull();
    expect(await downloaded!.text()).toBe("hero-image-bytes");
  });

  it("overwrites the previous hero image rather than accumulating", async () => {
    await POST(
      uploadRequest(makeFile("first.jpg", "first-bytes", "image/jpeg")),
    );
    await POST(
      uploadRequest(makeFile("second.jpg", "second-bytes", "image/jpeg")),
    );

    const { data: downloaded } = await supabaseAdmin.storage
      .from("property-images")
      .download(HERO_PATH);
    expect(await downloaded!.text()).toBe("second-bytes");
  });
});
