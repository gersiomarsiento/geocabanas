// app/api/admin/site-hero/route.ts
//
// POST -> uploads hero media for slide 1, 2 or 3.
//  - multipart/form-data { file, slide? }  -> image, uploaded through this route
//  - application/json { action: "sign" }   -> validates a video and returns a signed upload URL
//  - application/json { action: "commit" } -> after the browser uploaded the video, saves media type
//
// TODO: gate this route behind your admin auth/session check before ship.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateImageFile } from "@/lib/uploads/validateImageFile";
import {
  HERO_PATHS,
  HERO_MEDIA_TYPE_COLUMNS,
  type HeroSlideId,
  type HeroMediaType,
} from "@/lib/site/hero";

const BUCKET = "property-images";
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // Supabase free plan limit

interface JsonBody {
  action?: "sign" | "commit";
  slide?: number;
  contentType?: string;
  size?: number;
}

function parseSlide(value: unknown): HeroSlideId | null {
  const n = Number(value ?? 1);
  return n === 1 || n === 2 || n === 3 ? n : null;
}

function buildPublicUrl(slide: HeroSlideId): string {
  const { data } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(HERO_PATHS[slide]);
  return `${data.publicUrl}?v=${Date.now()}`;
}

async function saveMediaType(slide: HeroSlideId, type: HeroMediaType) {
  const { error } = await supabaseAdmin.from("site_settings").upsert(
    {
      id: "singleton",
      [HERO_MEDIA_TYPE_COLUMNS[slide]]: type,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  return error;
}

export async function POST(request: Request) {
  const requestType = request.headers.get("content-type") ?? "";

  // ---------- VIDEO FLOW (JSON) ----------
  if (requestType.includes("application/json")) {
    const body = (await request.json()) as JsonBody;
    const slide = parseSlide(body.slide);
    if (!slide) {
      return NextResponse.json({ error: "Slide inválido" }, { status: 400 });
    }
    const path = HERO_PATHS[slide];

    if (body.action === "sign") {
      if (!ALLOWED_VIDEO_TYPES.includes(body.contentType ?? "")) {
        return NextResponse.json(
          { error: "El video debe ser MP4 o WEBM" },
          { status: 400 },
        );
      }
      if (
        typeof body.size !== "number" ||
        body.size <= 0 ||
        body.size > MAX_VIDEO_SIZE_BYTES
      ) {
        return NextResponse.json(
          { error: "El video no puede superar los 50MB" },
          { status: 400 },
        );
      }

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUploadUrl(path, { upsert: true });

      if (error || !data) {
        return NextResponse.json(
          { error: "No se pudo preparar la subida" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        ok: true,
        bucket: BUCKET,
        path: data.path,
        token: data.token,
        signedUrl: data.signedUrl,
      });
    }

    if (body.action === "commit") {
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from(BUCKET)
        .list("site");
      const fileName = path.replace("site/", "");
      if (listError || !files?.some((f) => f.name === fileName)) {
        return NextResponse.json(
          { error: "No se encontró el video subido" },
          { status: 400 },
        );
      }

      const saveError = await saveMediaType(slide, "video");
      if (saveError) {
        return NextResponse.json(
          { error: "No se pudo guardar el tipo de archivo" },
          { status: 500 },
        );
      }

      const url = buildPublicUrl(slide);
      return NextResponse.json({
        ok: true,
        heroUrl: url,
        media: { url, type: "video" as const },
      });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  // ---------- IMAGE FLOW (multipart) ----------
  const formData = await request.formData();
  const file = formData.get("file");
  const slide = parseSlide(formData.get("slide"));

  if (!slide) {
    return NextResponse.json({ error: "Slide inválido" }, { status: 400 });
  }
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(HERO_PATHS[slide], arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo subir la imagen" },
      { status: 500 },
    );
  }

  const saveError = await saveMediaType(slide, "image");
  if (saveError) {
    return NextResponse.json(
      { error: "No se pudo guardar el tipo de archivo" },
      { status: 500 },
    );
  }

  const url = buildPublicUrl(slide);
  return NextResponse.json({
    ok: true,
    heroUrl: url,
    media: { url, type: "image" as const },
  });
}
