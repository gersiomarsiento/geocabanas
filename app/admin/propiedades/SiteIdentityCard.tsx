"use client";

// app/admin/propiedades/SiteIdentityCard.tsx
//
// Logo + "Quiénes somos" (not tied to any slide).

import { useEffect, useState } from "react";
import { resizeImageForUpload } from "@/lib/resizeImageForUpload";

interface AboutCopy {
  aboutTitle: string;
  aboutText: string;
}

export default function SiteIdentityCard() {
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined); // undefined = loading
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [about, setAbout] = useState<AboutCopy | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/site-settings", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la identidad");
        return res.json() as Promise<
          { logoUrl: string | null } & Partial<AboutCopy>
        >;
      })
      .then((data) => {
        setLogoUrl(data.logoUrl);
        setAbout({
          aboutTitle: data.aboutTitle ?? "",
          aboutText: data.aboutText ?? "",
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploadingLogo(true);
    setError(null);
    try {
      const resized = await resizeImageForUpload(file, {
        maxDimension: 800,
        quality: 0.9,
      });
      const formData = new FormData();
      formData.append("file", resized);
      const res = await fetch("/api/admin/site-logo", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("No se pudo subir el logo");
      const data = (await res.json()) as { logoUrl: string };
      setLogoUrl(data.logoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave() {
    if (!about) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aboutTitle: { es: about.aboutTitle },
          aboutText: { es: about.aboutText },
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

  const inputClass =
    "w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm";
  const labelClass = "mb-1.5 block text-sm font-medium text-zinc-600";

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-md bg-zinc-100">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-full w-full object-contain"
            />
          )}
        </div>
        <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm">
          {uploadingLogo
            ? "Subiendo…"
            : logoUrl
              ? "Cambiar logo"
              : "Subir logo"}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={uploadingLogo}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
      )}

      {about && (
        <>
          <div className="mt-6 grid gap-4 border-t border-zinc-200 pt-6">
            <h4>Quiénes somos</h4>

            <label className="block">
              <span className={labelClass}>Título</span>
              <input
                type="text"
                value={about.aboutTitle}
                onChange={(e) =>
                  setAbout((a) =>
                    a ? { ...a, aboutTitle: e.target.value } : a,
                  )
                }
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Texto</span>
              <textarea
                value={about.aboutText}
                onChange={(e) =>
                  setAbout((a) => (a ? { ...a, aboutText: e.target.value } : a))
                }
                rows={4}
                className={inputClass}
              />
            </label>
          </div>

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