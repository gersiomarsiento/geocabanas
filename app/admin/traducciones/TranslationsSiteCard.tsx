"use client";

// app/admin/traducciones/TranslationsSiteCard.tsx

import { useEffect, useState } from "react";
import type { LocalizedText } from "@/lib/i18n/getLocalized";
import type { EditableLocale } from "./page";

const LOCALIZED_KEYS = [
  "heroTitle",
  "heroSubtitle",
  "heroButtonText",
  "hero2Title",
  "hero2Subtitle",
  "hero2ButtonText",
  "hero3Title",
  "hero3Subtitle",
  "hero3ButtonText",
  "aboutTitle",
  "aboutText",
  "emailSubject",
  "emailIntro",
] as const;

type LocalizedKey = (typeof LOCALIZED_KEYS)[number];

type SiteTranslations = Record<LocalizedKey, LocalizedText | undefined>;
type SiteDraft = Record<LocalizedKey, string>;

const SLIDES = [
  { label: "Slide 1", prefix: "hero" },
  { label: "Slide 2", prefix: "hero2" },
  { label: "Slide 3", prefix: "hero3" },
] as const;

function getText(
  value: LocalizedText | undefined,
  locale: "es" | EditableLocale,
): string {
  return (value?.[locale] as string | undefined) ?? "";
}

function buildDraft(data: SiteTranslations, locale: EditableLocale): SiteDraft {
  const draft = {} as SiteDraft;
  for (const key of LOCALIZED_KEYS) {
    draft[key] = getText(data[key], locale);
  }
  return draft;
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

  function setField(key: LocalizedKey, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  // Slide 1 always shows; 2 and 3 only if they have Spanish text.
  function slideVisible(prefix: string) {
    if (prefix === "hero") return true;
    return (
      getText(data[`${prefix}Title` as LocalizedKey], "es") !== "" ||
      getText(data[`${prefix}Subtitle` as LocalizedKey], "es") !== "" ||
      getText(data[`${prefix}ButtonText` as LocalizedKey], "es") !== ""
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, LocalizedText | Record<string, string>> = {};
      for (const key of LOCALIZED_KEYS) {
        // Don't send fields of slides that aren't shown
        const slide = SLIDES.find(
          (s) =>
            key.startsWith(s.prefix) &&
            /^hero\d?(Title|Subtitle|ButtonText)$/.test(key),
        );
        if (slide && !slideVisible(slide.prefix)) continue;
        body[key] = { [locale]: draft[key] };
      }

      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  function renderField(key: LocalizedKey, label: string, multiline?: boolean) {
    return (
      <Field
        key={key}
        label={label}
        reference={getText(data[key], "es")}
        value={draft[key]}
        onChange={(v) => setField(key, v)}
        multiline={multiline}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <h4>Portada</h4>

      {SLIDES.filter((s) => slideVisible(s.prefix)).map((s, i) => (
        <div
          key={s.prefix}
          className={`grid gap-4 ${i > 0 ? "border-t border-zinc-200 pt-4" : ""}`}
        >
          <p className="text-sm font-semibold text-zinc-500">{s.label}</p>
          {renderField(`${s.prefix}Title` as LocalizedKey, "Título")}
          {renderField(`${s.prefix}Subtitle` as LocalizedKey, "Subtítulo")}
          {renderField(
            `${s.prefix}ButtonText` as LocalizedKey,
            "Texto del botón",
          )}
        </div>
      ))}

      <h4 className="border-t border-zinc-200 mt-3 pt-3">Quiénes Somos</h4>
      {renderField("aboutTitle", "Título")}
      {renderField("aboutText", "Texto", true)}

      <h4 className="border-t border-zinc-200 mt-3 pt-3">
        Email de confirmación
      </h4>
      {renderField("emailSubject", "Asunto", true)}
      {renderField("emailIntro", "Contenido", true)}

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
