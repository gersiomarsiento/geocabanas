"use client";

// app/admin/propiedades/SiteFaqCard.tsx

import { useEffect, useState } from "react";
import type { Faq } from "@/types/faqs";

export default function SiteFaqCard() {
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/admin/faqs")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las preguntas");
        return res.json() as Promise<Faq[]>;
      })
      .then(setFaqs)
      .catch((e) => setError(e.message));
  }, []);

  async function handleAdd() {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
      });
      if (!res.ok) throw new Error("No se pudo agregar la pregunta");
      const faq = (await res.json()) as Faq;
      setFaqs((prev) => [...(prev ?? []), faq]);
      setNewQuestion("");
      setNewAnswer("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Eliminar esta pregunta?");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setFaqs((prev) => prev?.filter((f) => f.id !== id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleFieldSave(
    id: string,
    patch: { question?: string; answer?: string },
  ) {
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    if (!faqs) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const current = faqs[index];
    const target = faqs[targetIndex];

    // Swap sort_order between the two — simplest reorder mechanism without
    // needing a dedicated bulk-reorder endpoint.
    const reordered = [...faqs];
    reordered[index] = target;
    reordered[targetIndex] = current;
    setFaqs(reordered);

    await Promise.all([
      fetch(`/api/admin/faqs/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/admin/faqs/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]).catch(() => setError("No se pudo reordenar"));
  }

  return (
    <div className=" ">

      {error && (
        <p className="mb-3 text-sm text-red-600 ">{error}</p>
      )}

      {!faqs ? (
        <p className="text-sm text-zinc-500 ">Cargando…</p>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FaqRow
              key={faq.id}
              faq={faq}
              isFirst={index === 0}
              isLast={index === faqs.length - 1}
              onMove={(direction) => handleMove(index, direction)}
              onSave={(patch) => handleFieldSave(faq.id, patch)}
              onDelete={() => handleDelete(faq.id)}
            />
          ))}
          {faqs.length === 0 && (
            <p className="text-sm text-zinc-500 ">
              Todavía no hay preguntas frecuentes.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-zinc-200 pt-6 ">
        <h3 className="mb-3 text-sm font-medium text-zinc-600 ">
          Agregar nueva pregunta
        </h3>
        <div className="grid gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600 ">
              Pregunta
            </span>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm  "
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600 ">
              Respuesta
            </span>
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm  "
            />
          </label>
          <button
            type="button"
            disabled={adding || !newQuestion.trim() || !newAnswer.trim()}
            onClick={handleAdd}
            className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            {adding ? "Agregando…" : "+ Agregar pregunta"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FaqRow({
  faq,
  isFirst,
  isLast,
  onMove,
  onSave,
  onDelete,
}: {
  faq: Faq;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: "up" | "down") => void;
  onSave: (patch: { question?: string; answer?: string }) => void;
  onDelete: () => void;
}) {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [dirty, setDirty] = useState(false);

  function save() {
    onSave({ question, answer });
    setDirty(false);
  }

  return (
    <div className="rounded-md border border-zinc-200 p-4 ">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={isFirst}
            aria-label="Subir"
            className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 "
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={isLast}
            aria-label="Bajar"
            className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 "
          >
            ↓
          </button>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-sm text-red-600 hover:underline "
        >
          Eliminar
        </button>
      </div>

      <input
        type="text"
        value={question}
        onChange={(e) => {
          setQuestion(e.target.value);
          setDirty(true);
        }}
        className="mb-2 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium  "
      />
      <textarea
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value);
          setDirty(true);
        }}
        rows={2}
        className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm  "
      />

      {dirty && (
        <button
          type="button"
          onClick={save}
          className="mt-2 rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-50  "
        >
          Guardar cambios
        </button>
      )}
    </div>
  );
}
