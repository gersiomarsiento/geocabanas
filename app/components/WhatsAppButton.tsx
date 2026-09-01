"use client";

import { useEffect, useState } from "react";

const DEFAULT_MESSAGE = "Hola! Quiero consultar por disponibilidad";

export default function WhatsAppButton() {
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { contactWhatsapp?: string | null } | null) => {
        if (data?.contactWhatsapp) setPhone(data.contactWhatsapp);
      })
      .catch(() => {
        // Silent fail: button just doesn't render if settings can't load,
        // same fallback behavior as SiteContactCard.
      });
  }, []);

  // contact_whatsapp is stored digits-only (e.g. "59899123456"), which is
  // exactly the format wa.me expects — no stripping/formatting needed.
  if (!phone) return null;

  const href = `https://wa.me/${phone}?text=${encodeURIComponent(
    DEFAULT_MESSAGE,
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className="fixed bottom-5 right-5 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-105"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 fill-white"
        aria-hidden="true"
      >
        <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.34.653 4.527 1.786 6.393L4 29l7.789-1.752A11.94 11.94 0 0 0 16.001 27C22.629 27 28 21.627 28 15S22.629 3 16.001 3Zm0 21.75a9.7 9.7 0 0 1-4.947-1.354l-.355-.21-4.62 1.04 1.06-4.5-.232-.368A9.7 9.7 0 0 1 5.25 15c0-5.936 4.815-10.75 10.751-10.75S26.75 9.064 26.75 15 21.936 24.75 16.001 24.75Zm5.598-7.9c-.307-.154-1.814-.895-2.096-.997-.281-.103-.486-.154-.69.154-.205.307-.792.997-.972 1.202-.179.205-.358.23-.665.077-.307-.154-1.296-.478-2.469-1.523-.913-.814-1.53-1.82-1.709-2.127-.179-.307-.019-.473.135-.626.139-.138.307-.358.46-.538.154-.179.205-.307.307-.512.103-.205.051-.384-.026-.538-.077-.154-.69-1.662-.945-2.278-.249-.6-.502-.518-.69-.527-.179-.008-.384-.01-.588-.01-.205 0-.538.077-.82.384-.281.307-1.075 1.05-1.075 2.56 0 1.51 1.1 2.97 1.253 3.175.154.205 2.167 3.31 5.25 4.64.734.317 1.307.506 1.754.648.737.234 1.408.201 1.938.122.591-.088 1.814-.741 2.07-1.457.256-.717.256-1.33.179-1.457-.077-.128-.281-.205-.588-.359Z" />
      </svg>
    </a>
  );
}
