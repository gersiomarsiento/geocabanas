"use client";

// app/admin/propiedades/SiteHeroCard.tsx

import { useEffect, useState } from "react";
import { resizeImageForUpload } from "@/lib/resizeImageForUpload";

export default function SiteHeroCard() {
  const [heroUrl, setHeroUrl] = useState<string | null | undefined>(undefined); // undefined = loading
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la imagen principal");
        return res.json() as Promise<{ heroUrl: string | null }>;
      })
      .then((data) => setHeroUrl(data.heroUrl))
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
    </div>
  );
}
