"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

export default function AboutSection() {
  const locale = useLocale();
  const t = useTranslations("About");

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

  return (
    <section
      aria-label={t("ariaLabel")}
      id="quienes-somos"
      className="isolate mx-auto relative text-black w-full px-3 py-10 md:px-6"
    >
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
              src="/images/beach.webp"
              alt="Mujer en la playa"
              width={180}
              height={240}
              className="absolute bottom-0 left-0 rounded-lg max-w-30 lg:max-w-full"
            />
            <Image
              src="/images/ocean.webp"
              alt="Mar de Punta del Diablo"
              width={620}
              height={412}
              className="w-full h-full pl-12.5 pb-3.5 rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}