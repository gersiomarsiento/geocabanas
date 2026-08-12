"use client";

// app/components/ContactSection.tsx
//
// Visitor-facing counterpart to app/admin/propiedades/SiteContactCard.tsx.
// Reads the same public GET /api/site-settings endpoint (no admin auth
// needed) and renders whatever the admin has filled in. Any field left
// empty in the admin form is simply omitted here instead of showing "null".

import { useEffect, useState } from "react";
import {
  WhatsAppIcon,
  MailIcon,
  InstagramIcon,
  PinIcon,
} from "@/app/components/icons";

interface SiteSettingsResponse {
  contactWhatsapp: string | null;
  contactEmail: string | null;
  contactInstagram: string | null;
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

  if (error) return null; // fail quietly on the public site rather than showing a broken card
  if (!settings) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm    ">
        <p className="text-sm text-zinc-500  ">Cargando contacto…</p>
      </div>
    );
  }

  const {
    contactWhatsapp,
    contactEmail,
    contactInstagram,
    mapLatitude,
    mapLongitude,
    mapAddress,
  } = settings;
  const hasMap = mapLatitude != null && mapLongitude != null;
  const hasAnyContact = Boolean(
    contactWhatsapp || contactEmail || contactInstagram,
  );

  if (!hasAnyContact && !hasMap) return null; // nothing configured yet — nothing to show visitors

  const mapsLink = hasMap
    ? `https://www.google.com/maps?q=${mapLatitude},${mapLongitude}`
    : mapAddress
      ? `https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}`
      : null;

  return (
    <div className="w-full border border-zinc-200 bg-white p-6 shadow-sm    ">
      <div className="max-w-360 w-full justify-self-center md:px-6 2xl:px-12">
        <h2 className="mb-4 text-lg font-semibold">Contacto</h2>
        <h4 className="font-bold">Geocabañas</h4>
        <p>Danubio y San Francisco, Punta del Diablo</p>
        <p>Rocha, Uruguay</p>
        <br />
        {hasAnyContact && (
          <div className="mb-6 flex flex-wrap gap-3">
            {contactWhatsapp && (
              <a
                href={`https://wa.me/${contactWhatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            )}
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                <MailIcon />
                {contactEmail}
              </a>
            )}
            {contactInstagram && (
              <a
                href={normalizeInstagramHandle(contactInstagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                <InstagramIcon />
                Instagram
              </a>
            )}
          </div>
        )}
        {hasMap && (
          <div>
            <div className="overflow-hidden rounded-lg border border-zinc-200  ">
              <iframe
                title="Ubicación"
                width="100%"
                height="280"
                loading="lazy"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${mapLatitude},${mapLongitude}&hl=es&z=14&output=embed`}
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
                        Cómo llegar
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
