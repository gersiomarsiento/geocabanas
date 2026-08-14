"use client";

// app/admin/propiedades/SiteHeroCard.tsx (imported from app/admin/sitio/page.tsx)

import { useEffect, useState } from "react";
import { resizeImageForUpload } from "@/lib/resizeImageForUpload";

interface HeroCopy {
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroButtonText: string | null;
  heroButtonHref: string | null;
}

export default function SiteHeroCard() {
  const [heroUrl, setHeroUrl] = useState<string | null | undefined>(undefined); // undefined = loading
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [copyDraft, setCopyDraft] = useState<HeroCopy | null>(null);
  const [savingCopy, setSavingCopy] = useState(false);
  const [copyMessage, setCopyMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la imagen principal");
        return res.json() as Promise<
          { heroUrl: string | null } & HeroCopy
        >;
      })
      .then((data) => {
        setHeroUrl(data.heroUrl);
        setCopyDraft({
          heroTitle: data.heroTitle,
          heroSubtitle: data.heroSubtitle,
          heroButtonText: data.heroButtonText,
          heroButtonHref: data.heroButtonHref,
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setError(null);

    try {
      const resized = await resizeImageForUpload(file, {
        maxDimension: 2560,
        quality: 0.85,
      });
      const formData = new FormData();
      formData.append("file", resized);
      const res = await fetch("/api/admin/site-hero", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("No se pudo subir la imagen");
      const data = (await res.json()) as { heroUrl: string };
      setHeroUrl(data.heroUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveCopy() {
    if (!copyDraft) return;
    setSavingCopy(true);
    setCopyMessage(null);

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copyDraft),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      setCopyMessage({ type: "success", text: "Guardado." });
    } catch (e) {
      setCopyMessage({ type: "error", text: e instanceof Error ? e.message : "Error" });
    } finally {
      setSavingCopy(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm    ">
      <h2 className="mb-4 text-base font-semibold">
        Imagen principal del sitio
      </h2>

      {heroUrl === undefined ? (
        <p className="text-sm text-zinc-500  ">Cargando…</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="h-24 w-40 overflow-hidden rounded-md bg-zinc-100  ">
            {heroUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                Sin imagen
              </div>
            )}
          </div>

          <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm  ">
            {uploading
              ? "Subiendo…"
              : heroUrl
                ? "Cambiar imagen"
                : "Subir imagen"}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600 ">
          {error}
        </p>
      )}

      {/* NEW: hero copy section */}
      {copyDraft && (
        <>
          <div className="mt-6 grid gap-4 border-t border-zinc-200 pt-6 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">Título</span>
              <input
                type="text"
                value={copyDraft.heroTitle ?? ""}
                onChange={(e) =>
                  setCopyDraft((d) => (d ? { ...d, heroTitle: e.target.value } : d))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">Subtítulo</span>
              <input
                type="text"
                value={copyDraft.heroSubtitle ?? ""}
                onChange={(e) =>
                  setCopyDraft((d) => (d ? { ...d, heroSubtitle: e.target.value } : d))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                Texto del botón
              </span>
              <input
                type="text"
                value={copyDraft.heroButtonText ?? ""}
                onChange={(e) =>
                  setCopyDraft((d) => (d ? { ...d, heroButtonText: e.target.value } : d))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                Link del botón (ej: #reservar-button)
              </span>
              <input
                type="text"
                value={copyDraft.heroButtonHref ?? ""}
                onChange={(e) =>
                  setCopyDraft((d) => (d ? { ...d, heroButtonHref: e.target.value } : d))
                }
                placeholder="#reservar-button"
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            El link debe empezar con # y coincidir con el id de una sección real del sitio. Si no
            coincide con ningún id, el botón no va a hacer nada al hacer clic.
          </p>

          <button
            type="button"
            disabled={savingCopy}
            onClick={handleSaveCopy}
            className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
          >
            {savingCopy ? "Guardando…" : "Guardar textos"}
          </button>

          {copyMessage && (
            <p
              className={`mt-3 text-sm font-medium ${
                copyMessage.type === "success" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {copyMessage.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}
