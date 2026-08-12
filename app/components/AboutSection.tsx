// app/components/AboutSection.tsx

"use client";

import { useEffect, useState } from "react";

interface PublicProperty {
  id: string;
  name: string;
  slug: string;
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
      className="mx-auto bg-black text-white w-full px-3 py-10 md:px-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold">Quiénes somos</h2>
        <p className="mx-auto mt-3 max-w-md text-sm ">
          Somos una familia de Punta del Diablo dedicada a ofrecer estadías
          cómodas y a pasos de la playa. Cada cabaña está pensada para que te
          sientas como en casa.
        </p>
        {/* <a
          href="#reservar-button"
          className="mt-5 inline-block rounded-md border border-black bg-white px-4 py-2 text-sm font-bold transition-colors hover:bg-zinc-100 "
        >
          RESERVAR
        </a> */}
      </div>

      <div className="mt-10">
        <h3 className="text-center text-lg font-semibold">Nuestras cabañas</h3>

        {!properties ? (
          <p className="mt-4 text-center text-sm text-zinc-500  ">Cargando…</p>
        ) : properties.length > 0 ? (
          <div className="mt-5 flex flex-wrap justify-center gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex w-40 flex-col items-center gap-2 text-center"
              >
                <div className="h-40 w-40 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100    ">
                  {property.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={property.imageUrl}
                      alt={property.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-400">
                      {property.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{property.name}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
