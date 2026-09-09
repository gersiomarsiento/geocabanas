"use client";

// app/admin/propiedades/SiteReviewsCard.tsx

import { useEffect, useState } from "react";
import type { Review, ReviewSource } from "@/types/reviews";
import { CaretIcon } from "@/app/components/icons";

const SOURCES: ReviewSource[] = ["Google", "Booking", "Airbnb"];

export default function SiteReviewsCard() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newAuthor, setNewAuthor] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newSource, setNewSource] = useState<ReviewSource>("Google");
  const [newUrl, setNewUrl] = useState("");
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las reseñas");
        return res.json() as Promise<Review[]>;
      })
      .then(setReviews)
      .catch((e) => setError(e.message));
  }, []);

  async function handleAdd() {
    if (!newAuthor.trim() || !newUrl.trim() || !newText.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: newAuthor,
          rating: newRating,
          source: newSource,
          url: newUrl,
          text: newText,
        }),
      });
      if (!res.ok) throw new Error("No se pudo agregar la reseña");
      const review = (await res.json()) as Review;
      setReviews((prev) => [...(prev ?? []), review]);
      setNewAuthor("");
      setNewRating(5);
      setNewSource("Google");
      setNewUrl("");
      setNewText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Eliminar esta reseña?");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setReviews((prev) => prev?.filter((r) => r.id !== id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleFieldSave(
    id: string,
    patch: Partial<{
      author: string;
      rating: number;
      source: ReviewSource;
      url: string;
      text: string;
    }>,
  ) {
    try {
      const { text, ...rest } = patch;
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          ...(text != null ? { text: { es: text } } : {}),
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    if (!reviews) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reviews.length) return;

    const current = reviews[index];
    const target = reviews[targetIndex];

    const reordered = [...reviews];
    reordered[index] = target;
    reordered[targetIndex] = current;
    setReviews(reordered);

    await Promise.all([
      fetch(`/api/admin/reviews/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/admin/reviews/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]).catch(() => setError("No se pudo reordenar"));
  }

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm font-medium text-red-600">{error}</p>
      )}

      {!reviews ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review, index) => (
            <ReviewRow
              key={review.id}
              review={review}
              isFirst={index === 0}
              isLast={index === reviews.length - 1}
              onMove={(direction) => handleMove(index, direction)}
              onSave={(patch) => handleFieldSave(review.id, patch)}
              onDelete={() => handleDelete(review.id)}
            />
          ))}
          {reviews.length === 0 && (
            <p className="text-sm text-zinc-500">Todavía no hay reseñas.</p>
          )}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 text-lg font-semibold text-primary">
          Agregar nueva reseña
        </h4>
        <div className="grid gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              Autor
            </span>
            <input
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                Calificación
              </span>
              <select
                value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value))}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                Fuente
              </span>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value as ReviewSource)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              URL de la reseña
            </span>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              Texto
            </span>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <button
            type="button"
            disabled={
              adding || !newAuthor.trim() || !newUrl.trim() || !newText.trim()
            }
            onClick={handleAdd}
            className="w-fit rounded-md bg-black px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {adding ? "Agregando…" : "+ Agregar reseña"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  review,
  isFirst,
  isLast,
  onMove,
  onSave,
  onDelete,
}: {
  review: Review;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: "up" | "down") => void;
  onSave: (
    patch: Partial<{
      author: string;
      rating: number;
      source: ReviewSource;
      url: string;
      text: string;
    }>,
  ) => void;
  onDelete: () => void;
}) {
  const [author, setAuthor] = useState(review.author);
  const [rating, setRating] = useState(review.rating);
  const [source, setSource] = useState<ReviewSource>(review.source);
  const [url, setUrl] = useState(review.url);
  const [text, setText] = useState(review.text);
  const [dirty, setDirty] = useState(false);

  function markDirty() {
    setDirty(true);
  }

  function save() {
    onSave({ author, rating, source, url, text });
    setDirty(false);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={isFirst}
            aria-label="Subir"
            className="rounded-md px-2 py-1 text-primary hover:bg-primary-50 disabled:opacity-30"
          >
            <CaretIcon className="rotate-270" />
          </button>

          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={isLast}
            aria-label="Bajar"
            className="rounded-md px-2 py-1 text-primary hover:bg-primary-50 disabled:opacity-30"
          >
            <CaretIcon className="rotate-90" />
          </button>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Eliminar
        </button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor={`review-author-${review.id}`}
            className="mb-1 block text-xs font-medium text-zinc-700"
          >
            Autor
          </label>

          <input
            id={`review-author-${review.id}`}
            type="text"
            value={author}
            onChange={(e) => {
              setAuthor(e.target.value);
              markDirty();
            }}
            placeholder="Autor"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div>
          <label
            htmlFor={`review-rating-${review.id}`}
            className="mb-1 block text-xs font-medium text-zinc-700"
          >
            Valoración
          </label>

          <select
            id={`review-rating-${review.id}`}
            value={rating}
            onChange={(e) => {
              setRating(Number(e.target.value));
              markDirty();
            }}
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor={`review-source-${review.id}`}
            className="mb-1 block text-xs font-medium text-zinc-700"
          >
            Fuente
          </label>

          <select
            id={`review-source-${review.id}`}
            value={source}
            onChange={(e) => {
              setSource(e.target.value as ReviewSource);
              markDirty();
            }}
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`review-url-${review.id}`}
            className="mb-1 block text-xs font-medium text-zinc-700"
          >
            URL
          </label>

          <input
            id={`review-url-${review.id}`}
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              markDirty();
            }}
            placeholder="URL"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`review-text-${review.id}`}
          className="mb-1 block text-xs font-medium text-zinc-700"
        >
          Texto
        </label>

        <textarea
          id={`review-text-${review.id}`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            markDirty();
          }}
          rows={2}
          placeholder="Texto"
          className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {dirty && (
        <button
          type="button"
          onClick={save}
          className="mt-2 rounded-md bg-accent-500 px-3 py-1 text-xs font-semibold text-accent-foreground transition hover:brightness-95"
        >
          Guardar cambios
        </button>
      )}
    </div>
  );
}
