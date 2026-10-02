"use client";

// app/components/ImageManager.tsx
//
// Generic upload / delete / drag-to-reorder image manager.
// Expects an API at `apiBase` with:
//   GET    {apiBase}            -> [{ id, url, sortOrder }]
//   POST   {apiBase}            -> FormData("file") -> { id, url, sortOrder }
//   DELETE {apiBase}/{id}
//   PATCH  {apiBase}/reorder    -> { order: string[] }
//
// Needs: npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { resizeImageForUpload } from "@/lib/resizeImageForUpload";

interface ManagedImage {
  id: string;
  url: string;
  sortOrder: number;
}

function SortableImage({
  image,
  isCover,
  onDelete,
}: {
  image: ManagedImage;
  isCover: boolean;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative aspect-square overflow-hidden rounded-md ${
        isDragging ? "z-10 opacity-80 shadow-lg" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt=""
        draggable={false}
        className="h-full w-full object-cover"
      />

      {/* Drag handle only: the rest of the tile still scrolls the page on touch */}
      <button
        type="button"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 cursor-grab touch-none rounded-md bg-primary/60 px-2 py-1 text-xs text-primary-foreground active:cursor-grabbing"
      >
        ⠿
      </button>

      {isCover && (
        <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-primary/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
          Portada
        </span>
      )}

      <button
        type="button"
        onClick={() => onDelete(image.id)}
        className="absolute right-1 top-1 rounded-md bg-primary/60 px-2 py-1 text-xs text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        Eliminar
      </button>
    </div>
  );
}

export default function ImageManager({
  apiBase,
  showCover = false,
  label = "Fotos",
  emptyText = "Todavía no hay fotos.",
}: {
  /** e.g. `/api/admin/properties/${id}/images` or `/api/admin/common-areas` */
  apiBase: string;
  /** Marks the first image as "Portada" */
  showCover?: boolean;
  label?: string;
  emptyText?: string;
}) {
  const [images, setImages] = useState<ManagedImage[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    // distance: a plain click on a button doesn't start a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setImages(null);
    fetch(apiBase)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las imágenes");
        return res.json() as Promise<ManagedImage[]>;
      })
      .then((data) =>
        setImages([...data].sort((a, b) => a.sortOrder - b.sortOrder)),
      )
      .catch((e) => setError(e.message));
  }, [apiBase]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-selecting the same file later

    setUploading(true);
    setError(null);

    try {
      const resized = await resizeImageForUpload(file);
      const formData = new FormData();
      formData.append("file", resized);
      const res = await fetch(apiBase, { method: "POST", body: formData });
      if (!res.ok) throw new Error("No se pudo subir la imagen");
      const image = (await res.json()) as ManagedImage;
      setImages((prev) => [...(prev ?? []), image]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: string) {
    if (!window.confirm("¿Eliminar esta imagen?")) return;

    try {
      const res = await fetch(`${apiBase}/${imageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar la imagen");
      setImages((prev) => prev?.filter((img) => img.id !== imageId) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!images || !over || active.id === over.id) return;

    const from = images.findIndex((i) => i.id === active.id);
    const to = images.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;

    const previous = images;
    const next = arrayMove(images, from, to).map((img, i) => ({
      ...img,
      sortOrder: i,
    }));

    setImages(next); // optimistic
    setError(null);

    try {
      const res = await fetch(`${apiBase}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setImages(previous); // roll back
      setError("No se pudo guardar el nuevo orden");
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-600">
          {label}
          {images && images.length > 1 && (
            <span className="ml-2 font-normal text-zinc-400">
              Arrastrá para cambiar el orden
            </span>
          )}
        </span>
        <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
          {uploading ? "Subiendo…" : "+ Agregar foto"}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!images ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : images.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          {emptyText}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((image, index) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  isCover={showCover && index === 0}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
