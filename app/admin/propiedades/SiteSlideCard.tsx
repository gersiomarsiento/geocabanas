"use client";

// app/admin/propiedades/SiteSlideCard.tsx
//
// Admin form for one homepage slide: media (image or video) + texts.

import { useEffect, useState } from "react";
import { resizeImageForUpload } from "@/lib/resizeImageForUpload";

type SlideId = 1 | 2 | 3;

interface MediaInfo {
  url: string;
  type: "image" | "video";
}

interface SlideCopy {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonHref: string;
}

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const VIDEO_TYPES = ["video/mp4", "video/webm"];

// Slide 1 keeps the original "hero*" keys; slides 2 and 3 use "hero2*" / "hero3*".
function keyPrefix(slide: SlideId) {
  return slide === 1 ? "hero" : `hero${slide}`;
}

async function uploadVideo(file: File, slide: SlideId): Promise<MediaInfo> {
  if (!VIDEO_TYPES.includes(file.type)) {
    throw new Error("El video debe ser MP4 o WEBM");
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("El video no puede superar los 50MB");
  }

  // 1. Ask the server for a signed upload URL
  const signRes = await fetch("/api/admin/site-hero", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sign",
      slide,
      contentType: file.type,
      size: file.size,
    }),
  });
  const signData = await signRes.json();
  if (!signRes.ok) throw new Error(signData.error ?? "Error al subir");

  // 2. Upload straight to Supabase Storage (same request the SDK makes)
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);
  const putRes = await fetch(signData.signedUrl, {
    method: "PUT",
    headers: { "x-upsert": "true" },
    body,
  });
  if (!putRes.ok) throw new Error("No se pudo subir el video");

  // 3. Tell the server it's there so it saves the media type
  const commitRes = await fetch("/api/admin/site-hero", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "commit", slide }),
  });
  const commitData = await commitRes.json();
  if (!commitRes.ok) throw new Error(commitData.error ?? "Error al guardar");

  return commitData.media as MediaInfo;
}

async function uploadImage(file: File, slide: SlideId): Promise<MediaInfo> {
  const resized = await resizeImageForUpload(file, {
    maxDimension: 2560,
    quality: 0.85,
  });
  const formData = new FormData();
  formData.append("file", resized);
  formData.append("slide", String(slide));
  const res = await fetch("/api/admin/site-hero", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "No se pudo subir la imagen");
  return data.media as MediaInfo;
}

export default function SiteSlideCard({ slide }: { slide: SlideId }) {
  const [media, setMedia] = useState<MediaInfo | null | undefined>(undefined); // undefined = loading
  const [copy, setCopy] = useState<SlideCopy | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const p = keyPrefix(slide);

  useEffect(() => {
    fetch("/api/site-settings", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la portada");
        return res.json() as Promise<Record<string, unknown>>;
      })
      .then((data) => {
        const heroMedia = data.heroMedia as Record<number, MediaInfo | null>;
        setMedia(heroMedia?.[slide] ?? null);
        setCopy({
          title: (data[`${p}Title`] as string | null) ?? "",
          subtitle: (data[`${p}Subtitle`] as string | null) ?? "",
          buttonText: (data[`${p}ButtonText`] as string | null) ?? "",
          buttonHref: (data[`${p}ButtonHref`] as string | null) ?? "",
        });
      })
      .catch((e) => setError(e.message));
  }, [slide, p]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setError(null);
    try {
      const uploaded = file.type.startsWith("video/")
        ? await uploadVideo(file, slide)
        : await uploadImage(file, slide);
      setMedia(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!copy) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [`${p}Title`]: { es: copy.title },
          [`${p}Subtitle`]: { es: copy.subtitle },
          [`${p}ButtonText`]: { es: copy.buttonText },
          [`${p}ButtonHref`]: copy.buttonHref,
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      setMessage({ type: "success", text: "Guardado." });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof SlideCopy, value: string) {
    setCopy((c) => (c ? { ...c, [field]: value } : c));
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm";
  const labelClass = "mb-1.5 block text-sm font-medium text-zinc-600";

  return (
    <div>
      {media === undefined ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="h-24 w-40 overflow-hidden rounded-md bg-zinc-100">
            {media?.type === "video" ? (
              <video
                src={media.url}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : media ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                Sin archivo
              </div>
            )}
          </div>

          <div>
            <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm">
              {uploading
                ? "Subiendo…"
                : media
                  ? "Cambiar imagen o video"
                  : "Subir imagen o video"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={handleFile}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="mt-2 text-xs text-zinc-400">
              Imagen: hasta 10MB. Video: MP4 o WEBM, hasta 50MB.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
      )}

      {copy && (
        <>
          <div className="mt-6 grid gap-4 border-t border-zinc-200 pt-6 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Título</span>
              <input
                type="text"
                value={copy.title}
                onChange={(e) => updateField("title", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className={labelClass}>Subtítulo</span>
              <input
                type="text"
                value={copy.subtitle}
                onChange={(e) => updateField("subtitle", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Texto del botón</span>
              <input
                type="text"
                value={copy.buttonText}
                onChange={(e) => updateField("buttonText", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>
                Link del botón (ej: #reservar-button)
              </span>
              <input
                type="text"
                value={copy.buttonHref}
                onChange={(e) => updateField("buttonHref", e.target.value)}
                placeholder="#reservar-button"
                className={inputClass}
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            El link debe empezar con # y coincidir con el id de una sección real
            del sitio.
          </p>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
          >
            {saving ? "Guardando…" : "Guardar textos"}
          </button>

          {message && (
            <p
              className={`mt-3 text-sm font-medium ${
                message.type === "success" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}
