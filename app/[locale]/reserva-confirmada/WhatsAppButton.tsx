"use client";

import { useEffect, useState } from "react";

export default function WhatsappButton({
  reservationId,
}: {
  reservationId: string;
}) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`wa:${reservationId}`);
      if (stored?.startsWith("https://wa.me/")) setHref(stored);
    } catch {
      // ignore
    }
  }, [reservationId]);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-6 inline-block rounded-md bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
    >
      Enviar mi reserva por WhatsApp
    </a>
  );
}
