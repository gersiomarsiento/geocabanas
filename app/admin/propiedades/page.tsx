"use client";

// app/admin/propiedades/page.tsx

import { useEffect, useState } from "react";
import type {
  Property,
  PropertySettingsUpdate,
} from "@/types/admin-availability";
// import SiteHeroCard from "./SiteHeroCard";
// import SiteContactCard from "./SiteContactCard";
import PropertyDetailsForm from "./PropertyDetailsForm";
import { resizeImageForUpload } from "@/lib/resizeImageForUpload";
import { ChevronIcon, CollapsibleSection, Switch } from "./AdminUI";

interface PropertyImage {
  id: string;
  url: string;
  sortOrder: number;
}

export default function PropiedadesPage() {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [addingOpen, setAddingOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/properties")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las propiedades");
        return res.json() as Promise<Property[]>;
      })
      .then(setProperties)
      .catch((e) => setError(e.message));
  }, []);

  function updatePropertyLocally(id: string, patch: Partial<Property>) {
    setProperties(
      (prev) =>
        prev?.map((p) => (p.id === id ? { ...p, ...patch } : p)) ?? null,
    );
  }

  async function handleAddProperty() {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo crear la propiedad");
      }

      setProperties((prev) => [...(prev ?? []), data]);
      setExpandedId(data.id); // open it immediately so the admin can fill in the rest
      setNewName("");
      setAddingOpen(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setCreating(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Propiedades</h1>
        {!addingOpen && (
          <button
            type="button"
            onClick={() => setAddingOpen(true)}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-semibold text-background"
          >
            + Agregar propiedad
          </button>
        )}
      </div>

      {addingOpen && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3">
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddProperty();
              if (e.key === "Escape") {
                setAddingOpen(false);
                setNewName("");
              }
            }}
            placeholder="Nombre de la propiedad"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={creating || !newName.trim()}
            onClick={handleAddProperty}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating ? "Creando…" : "Crear"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingOpen(false);
              setNewName("");
              setCreateError(null);
            }}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            Cancelar
          </button>
        </div>
      )}

      {createError && (
        <p className="mb-4 text-sm font-medium text-red-600">{createError}</p>
      )}
      {/* <SiteHeroCard /> */}
      {/* <SiteContactCard /> */}
      {!properties ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : properties.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
          Todavía no hay propiedades. Agregá la primera con el botón de arriba.
        </p>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              expanded={expandedId === property.id}
              onToggle={() =>
                setExpandedId((current) =>
                  current === property.id ? null : property.id,
                )
              }
              onUpdated={(patch) => updatePropertyLocally(property.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({
  property,
  expanded,
  onToggle,
  onUpdated,
}: {
  property: Property;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (patch: Partial<Property>) => void;
}) {
  const [draft, setDraft] = useState<PropertySettingsUpdate>({
    name: property.name,
    defaultPrice: property.defaultPrice,
    defaultMinStay: property.defaultMinStay,
    minReservationFee: property.minReservationFee,
    hideNightlyPrice: property.hideNightlyPrice,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      onUpdated(draft);
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
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors bg-primary text-primary-foreground hover:bg-zinc-50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
          {property.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="flex-1 text-base font-semibold">{property.name}</span>
        <ChevronIcon open={expanded} />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-zinc-200 px-6 py-5">
          <CollapsibleSection title="Precio y disponibilidad" defaultOpen>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                  Nombre
                </span>
                <input
                  type="text"
                  value={draft.name ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                  Precio por defecto
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.defaultPrice ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      defaultPrice: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                  Estadía mínima por defecto
                </span>
                <input
                  type="number"
                  min={1}
                  value={draft.defaultMinStay ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      defaultMinStay: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="mt-4">
              <Switch
                checked={Boolean(draft.hideNightlyPrice)}
                onChange={() =>
                  setDraft((d) => ({ ...d, hideNightlyPrice: !d.hideNightlyPrice }))
                }
                label="Ocultar precio por noche"
                description="Los visitantes solo verán el total de la estadía, no el precio de cada noche."
              />
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={saveSettings}
              className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
            >
              {saving ? "Guardando…" : "Guardar configuración"}
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
          </CollapsibleSection>

          <CollapsibleSection title="Detalles de la propiedad">
            <PropertyDetailsForm property={property} onUpdated={onUpdated} />
          </CollapsibleSection>

          <CollapsibleSection title="Fotos">
            <PropertyImages propertyId={property.id} />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

function PropertyImages({ propertyId }: { propertyId: string }) {
  const [images, setImages] = useState<PropertyImage[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/properties/${propertyId}/images`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las imágenes");
        return res.json() as Promise<PropertyImage[]>;
      })
      .then(setImages)
      .catch((e) => setError(e.message));
  }, [propertyId]);

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
      const res = await fetch(`/api/admin/properties/${propertyId}/images`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("No se pudo subir la imagen");
      const image = (await res.json()) as PropertyImage;
      setImages((prev) => [...(prev ?? []), image]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: string) {
    const confirmed = window.confirm("¿Eliminar esta imagen?");
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/admin/properties/${propertyId}/images/${imageId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("No se pudo eliminar la imagen");
      setImages((prev) => prev?.filter((img) => img.id !== imageId) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-600">Fotos</span>
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
          Todavía no hay fotos.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                className="absolute right-1 top-1 rounded-md bg-primary/60 px-2 py-1 text-xs text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}