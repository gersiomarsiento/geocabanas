"use client";

// app/components/ContactSection.tsx

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  PinIcon,
  LetterIcon,
  PhoneIcon,
} from "@/app/components/icons";

interface SiteSettingsResponse {
  logoUrl: string | null;
  businessName: string | null;
  businessAddress: string | null;
  contactWhatsapp: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactInstagram: string | null;
  contactFacebook: string | null;
  mapLatitude: number | null;
  mapLongitude: number | null;
  mapAddress: string | null;
}

function normalizeInstagramHandle(value: string) {
  const trimmed = value.trim().replace(/^@/, "");
  if (trimmed.startsWith("http")) return trimmed;
  return `https://instagram.com/${trimmed}`;
}

export default function ContactSection() {
  const t = useTranslations("Contact");
  const [settings, setSettings] = useState<SiteSettingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el contacto");
        return res.json() as Promise<SiteSettingsResponse>;
      })
      .then(setSettings)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return null;
  if (!settings) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-background p-6 shadow-sm    ">
        <p className="text-sm text-zinc-500  ">{t("cargando")}</p>
      </div>
    );
  }

  const {
    logoUrl,
    businessName,
    businessAddress,
    contactWhatsapp,
    contactPhone,
    contactEmail,
    contactInstagram,
    contactFacebook,
    mapLatitude,
    mapLongitude,
    mapAddress,
  } = settings;
  const hasMap = mapLatitude != null && mapLongitude != null;
  const hasAnyContact = Boolean(
    contactWhatsapp || contactEmail || contactInstagram || contactFacebook,
  );

  if (!hasAnyContact && !hasMap) return null;

  const mapsLink = hasMap
    ? `https://www.google.com/maps?q=${mapLatitude},${mapLongitude}`
    : mapAddress
      ? `https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}`
      : null;

  return (
    <div
      id="contact-section"
      className="w-full border border-zinc-200 bg-secondary-100 p-6 py-10 shadow-sm    "
    >
      <div className="max-w-354 md:flex md:justify-between w-full justify-self-center md:px-6 ">
        <div className="md:w-1/2 relative">
          <h2 className="mb-4">{t("titulo")}</h2>
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={businessName ?? "Logo"}
              width={120}
              height={30}
              className="mb-3 h-14 w-auto brightness-0"
            />
          )}
          {businessName && <h4 className="font-bold">{businessName}</h4>}
          {businessAddress &&
            businessAddress
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, i) => <p key={i}>{line}</p>)}
          {contactPhone && (
            <p className="flex gap-2 items-center mt-2">
              <span>
                <PhoneIcon />
              </span>
              {contactPhone}
            </p>
          )}
          {contactEmail && (
            <p className="flex gap-2 items-center mt-2">
              <span>
                <LetterIcon />
              </span>
              {contactEmail}
            </p>
          )}
          {hasAnyContact && (
            <div className="my-6 md:mb-0 flex flex-wrap gap-3">
              {contactWhatsapp && (
                <a
                  href={`https://wa.me/${contactWhatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md hover:bg-[#25D366] px-4 py-2 text-sm font-semibold text-primary transition-colors hover:text-primary-foreground"
                >
                  <WhatsAppIcon className="h-8 w-8" />
                </a>
              )}
              {contactInstagram && (
                <a
                  href={normalizeInstagramHandle(contactInstagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-[#8134af] hover:text-primary-foreground"
                >
                  <InstagramIcon className="h-8 w-8" />
                </a>
              )}
              {contactFacebook && (
                <a
                  href={contactFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-[#1877f2] hover:text-primary-foreground"
                >
                  <FacebookIcon className="h-8 w-8" />
                </a>
              )}
            </div>
          )}
        </div>
        {hasMap && (
          <div className="md:w-1/2 flex flex-col">
            <div className="overflow-hidden rounded-lg border border-zinc-200 flex-1 min-h-70">
              <iframe
                title={t("ubicacion")}
                width="100%"
                height="100%"
                loading="lazy"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${mapLatitude},${mapLongitude}&hl=es&z=14&output=embed`}
                className="min-h-70"
              />
            </div>
            {(mapAddress || mapsLink) && (
              <div className="mt-3 flex items-start gap-2 text-sm text-zinc-600  ">
                <PinIcon />
                <span className="flex-1">
                  {mapAddress}
                  {mapsLink && (
                    <>
                      {mapAddress && " · "}
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline underline-offset-2 hover:no-underline"
                      >
                        {t("comoLlegar")}
                      </a>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
