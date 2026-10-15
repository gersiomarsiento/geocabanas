"use client";

import { useTranslations } from "next-intl";
import { AMENITY_OPTIONS } from "@/lib/amenities";
import { Bed, Toilet, Users } from "lucide-react";

interface PropertyDetailsInfo {
  name: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  maxGuests: number | null;
  childrenAllowed: boolean | null;
  petsAllowed: boolean | null;
  amenities: string[];
}

export default function PropertyDetails({
  property,
}: {
  property: PropertyDetailsInfo;
}) {
  const t = useTranslations("PropertyDetails");
  const tAbout = useTranslations("About");
  const tUnits = useTranslations("Units");
  const tAmenities = useTranslations("Amenities");

  const stats = [
    property.bedrooms != null && {
      icon: <Bed className="w-5"/>,
      label: tUnits("habitaciones", { count: property.bedrooms }),
    },
    property.bathrooms != null && {
      icon: <Toilet className="w-5"/>,
      label: tUnits("banos", { count: property.bathrooms }),
    },
    property.maxGuests != null && {
      icon: <Users className="w-5"/>,
      label: tUnits("huespedes", { count: property.maxGuests }),
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
    <div className="w-full rounded-b-xl  border-zinc-200 bg-white p-3 md:p-6 shadow-sm">
      <h3 className="mb-4">{propertyName}</h3>
      {stats.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-700 ">
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
                  ? "bg-emerald-50 text-emerald-800 "
                  : "bg-zinc-100 text-zinc-500    "
              }`}
            >
              {property.childrenAllowed
                ? tAbout("aptoParaNinos")
                : t("noAptoParaNinos")}
            </span>
          )}
          {property.petsAllowed != null && (
            <span
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                property.petsAllowed
                  ? "bg-emerald-50 text-emerald-800 "
                  : "bg-zinc-100 text-zinc-500    "
              }`}
            >
              {property.petsAllowed
                ? t("seAceptanMascotas")
                : t("noSeAceptanMascotas")}
            </span>
          )}
        </div>
      )}

      {amenityLabels.length > 0 && (
        <div>
          <h4 className="mb-2">{t("serviciosYComodidades")}</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-zinc-700  sm:grid-cols-3">
            {amenityLabels.map((a) => (
              <span key={a.id} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {tAmenities(a.id)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
