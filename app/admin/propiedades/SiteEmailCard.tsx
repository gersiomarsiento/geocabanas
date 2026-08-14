"use client";

// app/admin/propiedades/SiteEmailCard.tsx (imported from app/admin/sitio/page.tsx)
//
// Deliberately scoped: admin can edit the subject line and intro
// paragraph only. The actual reservation details (dates, price,
// deposit) stay fixed in lib/email/reservationEmails.ts — that part
// has to stay accurate, this part is just surrounding copy.

import { useEffect, useState } from "react";

interface EmailCopy {
  emailSubject: string | null;
  emailIntro: string | null;
}

export default function SiteEmailCard() {
  const [draft, setDraft] = useState<EmailCopy | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la configuración");
        return res.json() as Promise<EmailCopy>;
      })
      .then((data) =>
        setDraft({
          emailSubject: data.emailSubject,
          emailIntro: data.emailIntro,
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
        body: JSON.stringify(draft),
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
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold">Email de confirmación</h2>
      <p className="mb-4 text-xs text-zinc-400">
        Los detalles de la reserva (fechas, precio, seña) se arman
        automáticamente — acá solo se edita el asunto y el texto de
        introducción.
      </p>

      {!draft ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              Asunto
            </span>
            <input
              type="text"
              value={draft.emailSubject ?? ""}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, emailSubject: e.target.value } : d,
                )
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              Texto de introducción
            </span>
            <textarea
              rows={4}
              value={draft.emailIntro ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, emailIntro: e.target.value } : d))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </label>
        </div>
      )}

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
            message.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
