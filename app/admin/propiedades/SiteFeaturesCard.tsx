// app/admin/propiedades/SiteFeaturesCard.tsx
"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_FEATURES_TITLE,
  DEFAULT_FEATURES,
  DEFAULT_STAY_INFO,
  FEATURE_ICONS,
  getFeatureIcon,
  type FeatureItem,
  type StayInfoItem,
} from "@/lib/site/features";

const inputCls = "w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm";
const iconBtn =
  "rounded-md border border-zinc-300 p-1.5 text-zinc-600 disabled:opacity-30";

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export default function SiteFeaturesCard() {
  const [lang, setLang] = useState<"es" | "en" | "pt">("es");
  const [title, setTitle] = useState<{
    es?: string;
    en?: string;
    pt?: string;
  } | null>(null);
  const [features, setFeatures] = useState<FeatureItem[] | null>(null);
  const [stayInfo, setStayInfo] = useState<StayInfoItem[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar");
        return res.json();
      })
      .then((data) => {
        setTitle(data.featuresTitle ?? DEFAULT_FEATURES_TITLE);
        setFeatures(data.features ?? DEFAULT_FEATURES);
        setStayInfo(data.stayInfo ?? DEFAULT_STAY_INFO);
      })
      .catch((e) => setMessage({ type: "error", text: e.message }));
  }, []);

  async function handleSave() {
    if (!features || !stayInfo || !title) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features, stayInfo, featuresTitle: title }),
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

  if (!features || !stayInfo || !title) {
    return (
      <p className="text-sm text-zinc-500">{message?.text ?? "Cargando…"}</p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-1">
        {(["es", "en", "pt"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`rounded-md border px-3 py-1 text-xs font-semibold uppercase ${
              lang === l
                ? "border-foreground bg-foreground text-background"
                : "border-zinc-300 text-zinc-600"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      {/* Features */}
      <label className="mb-5 block">
        <span className="mb-1.5 block text-sm font-semibold">
          Título de la sección
        </span>
        <input
          type="text"
          value={title[lang] ?? ""}
          maxLength={60}
          onChange={(e) => setTitle((p) => ({ ...p!, [lang]: e.target.value }))}
          className={inputCls}
          placeholder={lang === "es" ? "Título" : title.es}
        />
      </label>
      <ul className="space-y-2">
        {features.map((f, i) => {
          const Icon = getFeatureIcon(f.icon);
          return (
            <li key={i} className="flex items-center gap-2">
              <Icon className="h-5 w-5 shrink-0 text-zinc-700" />
              <select
                value={f.icon}
                onChange={(e) =>
                  setFeatures((p) =>
                    p!.map((x, k) =>
                      k === i ? { ...x, icon: e.target.value } : x,
                    ),
                  )
                }
                className="w-40 shrink-0 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
              >
                {Object.entries(FEATURE_ICONS).map(([key, { name }]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={f.label[lang] ?? ""}
                maxLength={60}
                onChange={(e) =>
                  setFeatures((p) =>
                    p!.map((x, k) =>
                      k === i
                        ? {
                            ...x,
                            label: { ...x.label, [lang]: e.target.value },
                          }
                        : x,
                    ),
                  )
                }
                className={inputCls}
                placeholder={lang === "es" ? "Texto" : f.label.es}
              />
              <button
                type="button"
                className={iconBtn}
                disabled={i === 0}
                onClick={() => setFeatures((p) => move(p!, i, -1))}
                aria-label="Subir"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={iconBtn}
                disabled={i === features.length - 1}
                onClick={() => setFeatures((p) => move(p!, i, 1))}
                aria-label="Bajar"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={iconBtn}
                onClick={() => setFeatures((p) => p!.filter((_, k) => k !== i))}
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={features.length >= 12}
        onClick={() =>
          setFeatures((p) => [...p!, { icon: "sun", label: { es: "" } }])
        }
        className="mt-3 inline-flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        <Plus className="h-4 w-4" /> Agregar
      </button>

      {/* Stay info */}
      <h4 className="mb-3 mt-6 border-t border-zinc-200 pt-6 text-sm font-semibold">
        Información de la estadía (máx. 4)
      </h4>
      <ul className="space-y-2">
        {stayInfo.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={s.value}
              maxLength={12}
              onChange={(e) =>
                setStayInfo((p) =>
                  p!.map((x, k) =>
                    k === i ? { ...x, value: e.target.value } : x,
                  ),
                )
              }
              className="w-28 shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              placeholder="3 PM"
            />
            <input
              type="text"
              value={s.label[lang] ?? ""}
              maxLength={30}
              onChange={(e) =>
                setStayInfo((p) =>
                  p!.map((x, k) =>
                    k === i
                      ? { ...x, label: { ...x.label, [lang]: e.target.value } }
                      : x,
                  ),
                )
              }
              className={inputCls}
              placeholder={lang === "es" ? "Check-in" : s.label.es}
            />
            <button
              type="button"
              className={iconBtn}
              disabled={i === 0}
              onClick={() => setStayInfo((p) => move(p!, i, -1))}
              aria-label="Subir"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={iconBtn}
              disabled={i === stayInfo.length - 1}
              onClick={() => setStayInfo((p) => move(p!, i, 1))}
              aria-label="Bajar"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={iconBtn}
              onClick={() => setStayInfo((p) => p!.filter((_, k) => k !== i))}
              aria-label="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={stayInfo.length >= 4}
        onClick={() =>
          setStayInfo((p) => [...p!, { value: "", label: { es: "" } }])
        }
        className="mt-3 inline-flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        <Plus className="h-4 w-4" /> Agregar
      </button>

      <div className="mt-6">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {message && (
          <p
            className={`mt-3 text-sm font-medium ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
