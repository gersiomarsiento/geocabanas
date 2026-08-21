"use client";

import { useEffect, useState } from "react";

interface CurrencySettings {
  exchangeRateUyu: number;
  exchangeRateBrl: number;
}

export default function SiteCurrencyCard() {
  const [draft, setDraft] = useState<CurrencySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo cargar la configuración");
        }

        return res.json() as Promise<CurrencySettings>;
      })
      .then((data) =>
        setDraft({
          exchangeRateUyu: data.exchangeRateUyu,
          exchangeRateBrl: data.exchangeRateBrl,
        }),
      )
      .catch((e) =>
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Error",
        }),
      );
  }, []);

  async function handleSave() {
    if (!draft) return;

    if (!Number.isFinite(draft.exchangeRateUyu) || draft.exchangeRateUyu < 0) {
      setMessage({
        type: "error",
        text: "La tasa de UYU debe ser mayor que 0.",
      });
      return;
    }

    if (!Number.isFinite(draft.exchangeRateBrl) || draft.exchangeRateBrl < 0) {
      setMessage({
        type: "error",
        text: "La tasa de BRL debe ser mayor que 0.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(data?.error ?? "No se pudo guardar");
      }

      setMessage({
        type: "success",
        text: "Tipos de cambio guardados.",
      });
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
    <div className=" ">
      {/* <h2 className="mb-1 text-base font-semibold">Tipos de cambio</h2> */}

      <p className="mb-4 text-xs text-zinc-400">
        Todos los precios del sistema se gestionan en USD. Estas tasas se usan
        únicamente para mostrar conversiones a pesos uruguayos y reales
        brasileños.
      </p>

      {!draft ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              1 USD = UYU
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.exchangeRateUyu}
              onChange={(e) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        exchangeRateUyu: Number(e.target.value),
                      }
                    : current,
                )
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              1 USD = BRL
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.exchangeRateBrl}
              onChange={(e) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        exchangeRateBrl: Number(e.target.value),
                      }
                    : current,
                )
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
