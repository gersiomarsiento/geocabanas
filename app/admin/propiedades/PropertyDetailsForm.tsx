"use client";

// app/admin/propiedades/PropertyDetailsForm.tsx

import { useState } from "react";
import type {
  Property,
  PropertySettingsUpdate,
} from "@/types/admin-availability";
import { AMENITY_OPTIONS } from "@/lib/amenities";
import { CheckIcon, Switch } from "./AdminUI";

export default function PropertyDetailsForm({
  property,
  onUpdated,
}: {
  property: Property;
  onUpdated: (patch: Partial<Property>) => void;
}) {
  const [draft, setDraft] = useState<PropertySettingsUpdate>({
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.maxGuests,
    childrenAllowed: property.childrenAllowed,
    petsAllowed: property.petsAllowed,
    amenities: property.amenities,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function toggleAmenity(id: string) {
    setDraft((d) => {
      const current = d.amenities ?? [];
      const next = current.includes(id)
        ? current.filter((a) => a !== id)
        : [...current, id];
      return { ...d, amenities: next };
    });
  }

  async function saveDetails() {
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
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-600">
            Habitaciones
          </span>
          <input
            type="number"
            min={0}
            value={draft.bedrooms ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, bedrooms: Number(e.target.value) }))
            }
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-600">
            Baños
          </span>
          <input
            type="number"
            min={0}
            value={draft.bathrooms ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, bathrooms: Number(e.target.value) }))
            }
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-600">
            Huéspedes máximos
          </span>
          <input
            type="number"
            min={1}
            value={draft.maxGuests ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, maxGuests: Number(e.target.value) }))
            }
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        <Switch
          checked={Boolean(draft.childrenAllowed)}
          onChange={() =>
            setDraft((d) => ({ ...d, childrenAllowed: !d.childrenAllowed }))
          }
          label="Se permiten niños"
        />
        <Switch
          checked={Boolean(draft.petsAllowed)}
          onChange={() =>
            setDraft((d) => ({ ...d, petsAllowed: !d.petsAllowed }))
          }
          label="Se permiten mascotas"
        />
      </div>

      <div className="mt-5">
        <span className="mb-2 block text-sm font-medium text-zinc-600">
          Servicios y comodidades
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {AMENITY_OPTIONS.map((amenity) => {
            const checked = (draft.amenities ?? []).includes(amenity.id);
            return (
              <button
                key={amenity.id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggleAmenity(amenity.id)}
                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-left text-sm transition-colors ${
                  checked
                    ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    checked
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-300 bg-background text-transparent"
                  }`}
                >
                  <CheckIcon />
                </span>
                {amenity.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={saveDetails}
        className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
      >
        {saving ? "Guardando…" : "Guardar detalles"}
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
