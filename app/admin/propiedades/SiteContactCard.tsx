"use client";

// app/admin/propiedades/SiteContactCard.tsx

import { useEffect, useState } from "react";

interface SiteSettingsResponse {
  contactWhatsapp: string | null;
  contactEmail: string | null;
  contactInstagram: string | null;
  mapLatitude: number | null;
  mapLongitude: number | null;
  mapAddress: string | null;
}

export default function SiteContactCard() {
  const [draft, setDraft] = useState<SiteSettingsResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la configuración");
        return res.json() as Promise<
          SiteSettingsResponse & { heroUrl: string | null }
        >;
      })
      .then((data) =>
        setDraft({
          contactWhatsapp: data.contactWhatsapp,
          contactEmail: data.contactEmail,
          contactInstagram: data.contactInstagram,
          mapLatitude: data.mapLatitude,
          mapLongitude: data.mapLongitude,
          mapAddress: data.mapAddress,
        }),
      )
      .catch((e) => setMessage({ type: "error", text: e.message }));
  }, []);

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactWhatsapp: draft.contactWhatsapp ?? "",
          contactEmail: draft.contactEmail ?? "",
          contactInstagram: draft.contactInstagram ?? "",
          mapLatitude: draft.mapLatitude,
          mapLongitude: draft.mapLongitude,
          mapAddress: draft.mapAddress ?? "",
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

  return (
    <div className="">
      {/* <h2 className="mb-4 text-base font-semibold">Contacto y ubicación</h2> */}

      {!draft ? (
        <p className="text-sm text-zinc-500  ">Cargando…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600  ">
              WhatsApp (sin + ni espacios, ej: 59899123456)
            </span>
            <input
              type="text"
              value={draft.contactWhatsapp ?? ""}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, contactWhatsapp: e.target.value } : d,
                )
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm    "
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600  ">
              Email de contacto
            </span>
            <input
              type="email"
              value={draft.contactEmail ?? ""}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, contactEmail: e.target.value } : d,
                )
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm    "
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600  ">
              Instagram
            </span>
            <input
              type="text"
              value={draft.contactInstagram ?? ""}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, contactInstagram: e.target.value } : d,
                )
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm    "
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600  ">
              Latitud
            </span>
            <input
              type="number"
              step="0.0000001"
              value={draft.mapLatitude ?? ""}
              onChange={(e) =>
                setDraft((d) =>
                  d
                    ? {
                        ...d,
                        mapLatitude:
                          e.target.value === "" ? null : Number(e.target.value),
                      }
                    : d,
                )
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm    "
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600  ">
              Longitud
            </span>
            <input
              type="number"
              step="0.0000001"
              value={draft.mapLongitude ?? ""}
              onChange={(e) =>
                setDraft((d) =>
                  d
                    ? {
                        ...d,
                        mapLongitude:
                          e.target.value === "" ? null : Number(e.target.value),
                      }
                    : d,
                )
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm    "
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600  ">
              Dirección (texto visible junto al mapa)
            </span>
            <input
              type="text"
              value={draft.mapAddress ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, mapAddress: e.target.value } : d))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm    "
            />
          </label>
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-400">
        Tip: hacé clic derecho en la ubicación en Google Maps y elegí las
        coordenadas para copiar latitud y longitud.
      </p>

      <button
        type="button"
        disabled={!draft || saving}
        onClick={handleSave}
        className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
      >
        {saving ? "Guardando…" : "Guardar"}
      </button>

      {message && (
        <p
          className={`mt-3 text-sm font-medium ${
            message.type === "success"
              ? "text-emerald-600 "
              : "text-red-600 "
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
