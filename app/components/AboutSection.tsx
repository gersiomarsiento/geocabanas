// app/components/AboutSection.tsx

"use client";

import { useEffect, useState } from "react";
import { BedIcon, UsersIcon, BathIcon, ChildIcon, PawIcon } from "./icons";

interface PublicProperty {
  id: string;
  name: string;
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

export default function AboutSection() {
  const [properties, setProperties] = useState<PropertyWithImage[] | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/properties")
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
  }, []);

  return (
    <section
      aria-label="Quiénes somos y nuestras cabañas"
      id="quienes-somos"
      className="mx-auto bg-primary text-primary-foreground w-full px-3 py-10 md:px-6"
    >
      <div className="text-center">
        <h2 className="text-xl md:text-3xl font-semibold">Quiénes somos</h2>
        <p className="mx-auto mt-3 md:mt-5 max-w-md md:max-w-2xl text-sm md:text-xl">
          Somos una familia de Punta del Diablo dedicada a ofrecer estadías
          cómodas y a pasos de la playa. Cada cabaña está pensada para que te
          sientas como en casa.
        </p>
      </div>

      <div className="mt-10 md:mt-16">
        <h3 className="text-center text-md md:text-2xl font-semibold">
          Nuestras cabañas
        </h3>

        {!properties ? (
          <p className="mt-4 text-center text-sm text-primary-foreground/70">
            Cargando…
          </p>
        ) : properties.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-5 md:mt-10 md:grid-cols-2 md:gap-6">
            {properties.map((property, index) => (
              <div
                key={property.id}
                className={`flex h-80 overflow-hidden rounded-xl border border-zinc-200 bg-primary-50 text-foreground shadow-sm ${
                  index % 2 === 0 ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div className="w-1/2 lg:w-3/5 shrink-0 self-stretch overflow-hidden bg-background">
                  {property.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={property.imageUrl}
                      alt={property.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-40 w-full items-center justify-center text-sm font-medium text-zinc-400">
                      {property.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className={`flex flex-1 flex-col justify-center gap-3 p-4 md:p-6 ${
                  index % 2 === 0 ? "items-end" : ""
                }`}>
                  <h4 className="text-base font-semibold md:text-lg">
                    {property.name}
                  </h4>

                  <ul className="flex flex-col flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-600">
                    {property.bedrooms != null && (
                      <li className={`flex items-center gap-1.5 ${
                        index % 2 === 0 ? "flex-row-reverse" : ""
                      }`}>
                        <BedIcon className="h-4 w-4 text-primary" />
                        {property.bedrooms}{" "}
                        {property.bedrooms === 1
                          ? "habitación"
                          : "habitaciones"}
                      </li>
                    )}

                    {property.maxGuests != null && (
                      <li className={`flex items-center gap-1.5 ${
                        index % 2 === 0 ? "flex-row-reverse" : ""
                      }`}>
                        <UsersIcon className="h-4 w-4 text-primary" />
                        {property.maxGuests}{" "}
                        {property.maxGuests === 1 ? "huésped" : "huéspedes"}
                      </li>
                    )}

                    {!!property.bathrooms && (
                      <li className={`flex items-center gap-1.5 ${
                        index % 2 === 0 ? "flex-row-reverse" : ""
                      }`}>
                        <BathIcon className="h-4 w-4 text-primary" />
                        {property.bathrooms}{" "}
                        {property.bathrooms === 1 ? "baño" : "baños"}
                      </li>
                    )}

                    {property.childrenAllowed && (
                      <li className={`flex items-center gap-1.5 ${
                        index % 2 === 0 ? "flex-row-reverse" : ""
                      }`}>
                        <ChildIcon className="h-4 w-4 text-primary" />
                        Apto para niños
                      </li>
                    )}

                    {property.petsAllowed && (
                      <li className={`flex items-center gap-1.5 ${
                        index % 2 === 0 ? "flex-row-reverse" : ""
                      }`}>
                        <PawIcon className="h-4 w-4 text-primary" />
                        Admite mascotas
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
