import { POST } from "@/app/api/admin/site-logo/route";
import { supabaseAdmin } from "@/lib/supabase/admin";

const LOGO_PATH = "site/logo";

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type });
}

function uploadRequest(file: File | null): Request {
  const formData = new FormData();
  if (file) formData.append("file", file);
  return new Request("http://localhost/api/admin/site-logo", {
    method: "POST",
    body: formData,
  });
}

afterEach(async () => {
  await supabaseAdmin.storage.from("property-images").remove([LOGO_PATH]);
});

describe("POST /api/admin/site-logo — validation", () => {
  it("returns 400 when no file is provided", async () => {
    const res = await POST(uploadRequest(null));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a disallowed MIME type", async () => {
    const res = await POST(
      uploadRequest(makeFile("doc.pdf", "content", "application/pdf")),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/site-logo — real upload", () => {
  it("uploads real bytes to the fixed site/logo path and includes a cache-busting query param", async () => {
    const res = await POST(
      uploadRequest(makeFile("logo.png", "logo-image-bytes", "image/png")),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.logoUrl).toContain("?v=");

    const { data: downloaded, error } = await supabaseAdmin.storage
      .from("property-images")
      .download(LOGO_PATH);
    expect(error).toBeNull();
    expect(await downloaded!.text()).toBe("logo-image-bytes");
  });

  it("overwrites the previous logo rather than accumulating", async () => {
    await POST(
      uploadRequest(makeFile("first.png", "first-bytes", "image/png")),
    );
    await POST(
      uploadRequest(makeFile("second.png", "second-bytes", "image/png")),
    );

    const { data: downloaded } = await supabaseAdmin.storage
      .from("property-images")
      .download(LOGO_PATH);
    expect(await downloaded!.text()).toBe("second-bytes");
  });
});
