"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BedIcon, UsersIcon, BathIcon, ChildIcon, PawIcon } from "./icons";
import Image from "next/image";

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

export default function AboutSection() {
  const locale = useLocale();
  const t = useTranslations("About");
  const tUnits = useTranslations("Units");

  const [properties, setProperties] = useState<PropertyWithImage[] | null>(
    null,
  );
  const [about, setAbout] = useState<{ title: string; text: string } | null>(
    null,
  );

  useEffect(() => {
    fetch(`/api/site-settings?locale=${locale}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la configuración");
        return res.json() as Promise<{ aboutTitle: string; aboutText: string }>;
      })
      .then((data) =>
        setAbout({ title: data.aboutTitle, text: data.aboutText }),
      )
      .catch(() => setAbout({ title: "", text: "" }));
  }, [locale]);

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
      id="quienes-somos"
      className="isolate mx-auto relative text-primary-foreground w-full px-3 py-10 md:px-6"
    >
      <Image
        src={`/images/bg_dark_mesh.webp`}
        alt={"Background gradient"}
        fill
        loading="lazy"
        className="absolute inset-0 object-cover -z-10"
        sizes="100vw"
      />
      <div className="text-center max-w-354 mx-auto">
        <h2 className="text-xl md:text-3xl font-semibold mb-6">
          {about?.title}
        </h2>
        <div className="flex flex-col md:flex-row gap-20 md:gap-4 pb-10">
          <div className="w-full md:max-w-1/2 content-center">
            <p className="text-left md:py-16.5 md:pr-10 md:text-[20px] xl:leading-[200%] whitespace-pre-line">
              {about?.text}
            </p>
          </div>
          <div className="w-full md:max-w-1/2 relative max-h-103">
            <Image
              src={`/images/beach.webp`}
              alt={"Mujer en la playa"}
              width={180}
              height={240}
              className="absolute bottom-0 left-0 rounded-lg max-w-30 lg:max-w-full"
            />
            <Image
              src={`/images/ocean.webp`}
              alt={"Mar de Punta del Diablo"}
              width={620}
              height={412}
              className="w-full h-full pl-12.5 pb-3.5 rounded-lg"
            />
          </div>
        </div>
      </div>

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
              <div
                key={property.id}
                className={`flex flex-col overflow-hidden rounded-xl bg-white text-foreground`}
              >
                <div className="w-full shrink-0 self-stretch overflow-hidden bg-background">
                  {property.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={property.imageUrl}
                      alt={property.name}
                      className=" w-full object-cover aspect-[32/21]"
                    />
                  ) : (
                    <div className="flex h-full min-h-40 w-full items-center justify-center text-sm font-medium text-zinc-400">
                      {property.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div
                  className={`flex flex-1 flex-col gap-3 md:gap-6 p-4 md:px-8 md:py-10`}
                >
                  <div>
                    <h4 className="text-base font-semibold md:text-[24px] font-gotham">
                      {property.name}
                    </h4>
                    {property.description && (
                      <p className="mt-4 text-sm md:text-[16px] font-light">{property.description}</p>
                    )}
                  </div>

                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-zinc-600">
                    {property.bedrooms != null && (
                      <li className={`flex items-center gap-1.5`}>
                        <BedIcon className="h-4 w-4 text-primary" />
                        {tUnits("habitaciones", { count: property.bedrooms })}
                      </li>
                    )}

                    {property.maxGuests != null && (
                      <li className={`flex items-center gap-1.5`}>
                        <UsersIcon className="h-4 w-4 text-primary" />
                        {tUnits("huespedes", { count: property.maxGuests })}
                      </li>
                    )}

                    {!!property.bathrooms && (
                      <li className={`flex items-center gap-1.5`}>
                        <BathIcon className="h-4 w-4 text-primary" />
                        {tUnits("banos", { count: property.bathrooms })}
                      </li>
                    )}

                    {property.childrenAllowed && (
                      <li className={`flex items-center gap-1.5`}>
                        <ChildIcon className="h-4 w-4 text-primary" />
                        {t("aptoParaNinos")}
                      </li>
                    )}

                    {property.petsAllowed && (
                      <li className={`flex items-center gap-1.5`}>
                        <PawIcon className="h-4 w-4 text-primary" />
                        {t("admiteMascotas")}
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
