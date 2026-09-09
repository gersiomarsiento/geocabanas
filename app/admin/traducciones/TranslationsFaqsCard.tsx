"use client";

// app/admin/traducciones/TranslationsFaqsCard.tsx

import { useState } from "react";
import type { FaqTranslations } from "@/types/faqs";
import type { EditableLocale } from "./page";

export default function TranslationsFaqsCard({
  locale,
  faqs,
  onSaved,
}: {
  locale: EditableLocale;
  faqs: FaqTranslations[];
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleSave(
    id: string,
    patch: { question?: string; answer?: string },
  ) {
    const res = await fetch(`/api/admin/faqs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(patch.question != null
          ? { question: { [locale]: patch.question } }
          : {}),
        ...(patch.answer != null ? { answer: { [locale]: patch.answer } } : {}),
      }),
    });
    if (!res.ok) throw new Error("No se pudo guardar");
    onSaved();
  }

  if (faqs.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todavía no hay preguntas frecuentes para traducir.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {faqs.map((faq) => (
        <FaqTranslationRow
          key={`${faq.id}-${locale}`}
          faq={faq}
          locale={locale}
          onSave={(patch) =>
            handleSave(faq.id, patch).catch((e) =>
              setError(e instanceof Error ? e.message : "Error desconocido"),
            )
          }
        />
      ))}
    </div>
  );
}

function FaqTranslationRow({
  faq,
  locale,
  onSave,
}: {
  faq: FaqTranslations;
  locale: EditableLocale;
  onSave: (patch: { question?: string; answer?: string }) => Promise<void>;
}) {
  const [question, setQuestion] = useState(faq.question[locale] ?? "");
  const [answer, setAnswer] = useState(faq.answer[locale] ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave({ question, answer });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs text-zinc-400">ES: {faq.question.es}</p>
      <input
        type="text"
        value={question}
        onChange={(e) => {
          setQuestion(e.target.value);
          setDirty(true);
        }}
        className="mb-2 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
      />

      <p className="mb-1 text-xs text-zinc-400">ES: {faq.answer.es}</p>
      <textarea
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value);
          setDirty(true);
        }}
        rows={2}
        className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
      />

      {dirty && (
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="mt-2 rounded-md bg-accent-500 px-3 py-1 text-xs font-semibold text-accent-foreground transition hover:brightness-95 disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      )}
    </div>
  );
}
