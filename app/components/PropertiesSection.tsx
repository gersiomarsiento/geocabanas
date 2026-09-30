"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BedIcon, UsersIcon, BathIcon, ChildIcon, PawIcon } from "./icons";
import SectionBackground from "./SectionBackground";

interface PublicProperty {
  id: string;
  name: string;
  description: string;
  slug: string;
  bedrooms: number | null;
  bathrooms: number | null;
  maxGuests: number | null;
  childrenAllowed: boolean | null;
  petsAllowed: boolean | null;
}

interface PropertyImage {
  id: string;
  url: string;
  sortOrder: number;
}

interface PropertyWithImage extends PublicProperty {
  imageUrl: string | null;
}

export default function PropertiesSection() {
  const locale = useLocale();
  const t = useTranslations("About");
  const tUnits = useTranslations("Units");

  const [properties, setProperties] = useState<PropertyWithImage[] | null>(
    null,
  );

  useEffect(() => {
    fetch(`/api/properties?locale=${locale}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las propiedades");
        return res.json() as Promise<PublicProperty[]>;
      })
      .then(async (data) => {
        const withImages = await Promise.all(
          data.map(async (property) => {
            try {
              const res = await fetch(`/api/properties/${property.id}/images`);
              if (!res.ok) return { ...property, imageUrl: null };
              const images = (await res.json()) as PropertyImage[];
              const first = [...images].sort(
                (a, b) => a.sortOrder - b.sortOrder,
              )[0];
              return { ...property, imageUrl: first?.url ?? null };
            } catch {
              return { ...property, imageUrl: null };
            }
          }),
        );
        setProperties(withImages);
      })
      .catch(() => setProperties([]));
  }, [locale]);

  return (
    <section
      aria-label={t("ariaLabel")}
      id="cabanas"
      className="isolate mx-auto relative text-black w-full px-3 py-10 md:px-6"
    >
      <SectionBackground />
      <div className="mx-auto mt-6 md:mt-10 max-w-354 w-full justify-self-center">
        <h3 className="text-center text-md md:text-2xl font-semibold">
          {t("nuestrasCabanas")}
        </h3>

        {!properties ? (
          <p className="mt-4 text-center text-sm text-primary-foreground/70">
            {t("cargando")}
          </p>
        ) : properties.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-5 md:mt-10 md:grid-cols-2 md:gap-4">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );

  function PropertyCard({ property }: { property: PropertyWithImage }) {
    return (
      <div className="flex flex-col overflow-hidden rounded-xl bg-white text-foreground">
        <div className="w-full shrink-0 self-stretch overflow-hidden bg-background">
          {property.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.imageUrl}
              alt={property.name}
              className="w-full object-cover aspect-[32/21]"
            />
          ) : (
            <div className="flex h-full min-h-40 w-full items-center justify-center text-sm font-medium text-zinc-400">
              {property.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 md:gap-6 p-4 md:px-8 md:py-10">
          <div>
            <h4 className="text-base font-semibold md:text-[24px] font-gotham">
              {property.name}
            </h4>
            {property.description && (
              <p className="mt-4 text-sm md:text-[16px] font-light">
                {property.description}
              </p>
            )}
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-zinc-600">
            {property.bedrooms != null && (
              <li className="flex items-center gap-1.5">
                <BedIcon className="h-4 w-4 text-primary" />
                {tUnits("habitaciones", { count: property.bedrooms })}
              </li>
            )}
            {property.maxGuests != null && (
              <li className="flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4 text-primary" />
                {tUnits("huespedes", { count: property.maxGuests })}
              </li>
            )}
            {!!property.bathrooms && (
              <li className="flex items-center gap-1.5">
                <BathIcon className="h-4 w-4 text-primary" />
                {tUnits("banos", { count: property.bathrooms })}
              </li>
            )}
            {property.childrenAllowed && (
              <li className="flex items-center gap-1.5">
                <ChildIcon className="h-4 w-4 text-primary" />
                {t("aptoParaNinos")}
              </li>
            )}
            {property.petsAllowed && (
              <li className="flex items-center gap-1.5">
                <PawIcon className="h-4 w-4 text-primary" />
                {t("admiteMascotas")}
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  }
}
