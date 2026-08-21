"use client";

// app/admin/propiedades/AdminUI.tsx
//
// Shared building blocks for the admin properties page, so PropertyCard's
// three subsections and PropertyDetailsForm's toggles all come from one
// definition instead of drifting copies.

import { useState } from "react";

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// Standard inline-flex + translate switch pattern — the knob is centered
// by flexbox itself rather than a hand-calculated top offset, which is
// what caused the previous version to look slightly off.
export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-foreground" : "bg-zinc-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// Consistent collapsible wrapper for each of a property's three
// subsections — same header font/weight/spacing regardless of which
// subsection it wraps, so "PRECIO Y DISPONIBILIDAD" / "DETALLES DE LA
// PROPIEDAD" / "FOTOS" all read as one family rather than three different
// styles.
export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors bg-primary/10 text-primary/80 hover:bg-zinc-50"
      >
        <span className="text-sm font-semibold uppercase tracking-wide">
          {title}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="border-t border-zinc-200 px-4 py-4">{children}</div>
      )}
    </div>
  );
}
