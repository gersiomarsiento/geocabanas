"use client";

import { AMENITY_OPTIONS } from "@/lib/amenities";

interface PropertyDetailsInfo {
  name: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  maxGuests: number | null;
  childrenAllowed: boolean | null;
  petsAllowed: boolean | null;
  amenities: string[];
}

function BedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
    >
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
      <path d="M3 18v2M21 18v2M3 12V6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4M14 10V6a1 1 0 0 1 1-1h4a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
    >
      <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2z" />
      <path d="M6 12V6a2 2 0 0 1 3.5-1.3M4 19h16" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.3 3-6 7-6s7 2.7 7 6" />
      <path d="M16 4.5a3 3 0 0 1 0 6M22 20c0-2.7-2-5-5-5.8" />
    </svg>
  );
}

export default function PropertyDetails({
  property,
}: {
  property: PropertyDetailsInfo;
}) {
  const stats = [
    property.bedrooms != null && {
      icon: <BedIcon />,
      label: `${property.bedrooms} ${
        property.bedrooms === 1 ? "habitación" : "habitaciones"
      }`,
    },
    property.bathrooms != null && {
      icon: <BathIcon />,
      label: `${property.bathrooms} ${
        property.bathrooms === 1 ? "baño" : "baños"
      }`,
    },
    property.maxGuests != null && {
      icon: <UsersIcon />,
      label: `Hasta ${property.maxGuests} ${
        property.maxGuests === 1 ? "huésped" : "huéspedes"
      }`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  const propertyName = property.name;

  const amenityLabels = AMENITY_OPTIONS.filter((a) =>
    property.amenities.includes(a.id),
  );

  const hasAnything =
    stats.length > 0 ||
    property.childrenAllowed != null ||
    property.petsAllowed != null ||
    amenityLabels.length > 0;

  if (!hasAnything) return null;

  return (
    <div className="w-full rounded-b-xl border border-zinc-200 bg-white p-3 md:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="font-bold mb-4">{propertyName}</div>
      {stats.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          {stats.map((stat, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {stat.icon}
              {stat.label}
            </span>
          ))}
        </div>
      )}

      {(property.childrenAllowed != null || property.petsAllowed != null) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {property.childrenAllowed != null && (
            <span
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                property.childrenAllowed
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              {property.childrenAllowed
                ? "Apto para niños"
                : "No apto para niños"}
            </span>
          )}
          {property.petsAllowed != null && (
            <span
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                property.petsAllowed
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              {property.petsAllowed
                ? "Se aceptan mascotas"
                : "No se aceptan mascotas"}
            </span>
          )}
        </div>
      )}

      {amenityLabels.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Servicios y comodidades
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-3">
            {amenityLabels.map((a) => (
              <span key={a.id} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {a.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
