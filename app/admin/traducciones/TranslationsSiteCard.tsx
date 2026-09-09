"use client";

// app/admin/traducciones/TranslationsSiteCard.tsx

import { useEffect, useState } from "react";
import type { LocalizedText } from "@/lib/i18n/getLocalized";
import type { EditableLocale } from "./page";

interface SiteTranslations {
  heroTitle: LocalizedText;
  heroSubtitle: LocalizedText;
  heroButtonText: LocalizedText;
  aboutTitle: LocalizedText;
  aboutText: LocalizedText;
}

interface SiteDraft {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  aboutTitle: string;
  aboutText: string;
}

function buildDraft(data: SiteTranslations, locale: EditableLocale): SiteDraft {
  return {
    heroTitle: data.heroTitle[locale] ?? "",
    heroSubtitle: data.heroSubtitle[locale] ?? "",
    heroButtonText: data.heroButtonText[locale] ?? "",
    aboutTitle: data.aboutTitle[locale] ?? "",
    aboutText: data.aboutText[locale] ?? "",
  };
}

export default function TranslationsSiteCard({
  locale,
  data,
  onSaved,
}: {
  locale: EditableLocale;
  data: SiteTranslations;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<SiteDraft>(() => buildDraft(data, locale));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setDraft(buildDraft(data, locale));
    setMessage(null);
  }, [data, locale]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroTitle: { [locale]: draft.heroTitle },
          heroSubtitle: { [locale]: draft.heroSubtitle },
          heroButtonText: { [locale]: draft.heroButtonText },
          aboutTitle: { [locale]: draft.aboutTitle },
          aboutText: { [locale]: draft.aboutText },
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      onSaved();
      setMessage({ type: "success", text: "Guardado." });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Error desconocido",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Field
        label="Título"
        reference={data.heroTitle.es}
        value={draft.heroTitle}
        onChange={(v) => setDraft((d) => ({ ...d, heroTitle: v }))}
      />
      <Field
        label="Subtítulo"
        reference={data.heroSubtitle.es}
        value={draft.heroSubtitle}
        onChange={(v) => setDraft((d) => ({ ...d, heroSubtitle: v }))}
      />
      <Field
        label="Texto del botón"
        reference={data.heroButtonText.es}
        value={draft.heroButtonText}
        onChange={(v) => setDraft((d) => ({ ...d, heroButtonText: v }))}
      />
      <Field
        label="Título (Quiénes somos)"
        reference={data.aboutTitle.es}
        value={draft.aboutTitle}
        onChange={(v) => setDraft((d) => ({ ...d, aboutTitle: v }))}
      />
      <Field
        label="Texto (Quiénes somos)"
        reference={data.aboutText.es}
        value={draft.aboutText}
        onChange={(v) => setDraft((d) => ({ ...d, aboutText: v }))}
        multiline
      />

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
      >
        {saving ? "Guardando…" : "Guardar traducciones"}
      </button>

      {message && (
        <p
          className={`text-sm font-medium ${
            message.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  reference,
  value,
  onChange,
  multiline,
}: {
  label: string;
  reference: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-600">
        {label}
      </span>
      <span className="mb-1.5 block text-xs text-zinc-400">
        ES: {reference || "—"}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
        />
      )}
    </label>
  );
}
