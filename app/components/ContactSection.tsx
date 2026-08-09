"use client";

// app/components/ContactSection.tsx
//
// Visitor-facing counterpart to app/admin/propiedades/SiteContactCard.tsx.
// Reads the same public GET /api/site-settings endpoint (no admin auth
// needed) and renders whatever the admin has filled in. Any field left
// empty in the admin form is simply omitted here instead of showing "null".

import { useEffect, useState } from "react";

interface SiteSettingsResponse {
  contactWhatsapp: string | null;
  contactEmail: string | null;
  contactInstagram: string | null;
  mapLatitude: number | null;
  mapLongitude: number | null;
  mapAddress: string | null;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.09.11-1.76-.11a15.4 15.4 0 0 1-1.65-.61c-2.9-1.25-4.79-4.17-4.94-4.36-.15-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.2-.15.32-.3.49-.15.17-.31.38-.44.51-.15.15-.31.31-.13.61.17.29.77 1.27 1.66 2.06 1.14 1.02 2.11 1.34 2.4 1.49.3.15.47.13.65-.08.17-.2.74-.86.94-1.16.2-.29.4-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.13.07.73-.17 1.41z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-5 w-5"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-5 w-5"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-5 w-5"
    >
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
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
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cargando contacto…
        </p>
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
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-4 text-lg font-semibold">Contacto y ubicación</h2>

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
              className="flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
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
              className="flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <InstagramIcon />
              Instagram
            </a>
          )}
        </div>
      )}

      {hasMap && (
        <div>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
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
            <div className="mt-3 flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
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
  );
}
