"use client";

// app/admin/traducciones/TranslationsReviewsCard.tsx

import { useState } from "react";
import type { ReviewTranslations } from "@/types/reviews";
import type { EditableLocale } from "./page";

export default function TranslationsReviewsCard({
  locale,
  reviews,
  onSaved,
}: {
  locale: EditableLocale;
  reviews: ReviewTranslations[];
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleSave(id: string, text: string) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: { [locale]: text } }),
    });
    if (!res.ok) throw new Error("No se pudo guardar");
    onSaved();
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todavía no hay reseñas para traducir.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {reviews.map((review) => (
        <ReviewTranslationRow
          key={`${review.id}-${locale}`}
          review={review}
          locale={locale}
          onSave={(text) =>
            handleSave(review.id, text).catch((e) =>
              setError(e instanceof Error ? e.message : "Error desconocido"),
            )
          }
        />
      ))}
    </div>
  );
}

function ReviewTranslationRow({
  review,
  locale,
  onSave,
}: {
  review: ReviewTranslations;
  locale: EditableLocale;
  onSave: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState(review.text[locale] ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(text);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-medium text-zinc-500">
        {review.author} · {review.rating}★ · {review.source}
      </p>

      <p className="mb-1 text-xs text-zinc-400">ES: {review.text.es}</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
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
