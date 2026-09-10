// lib/i18n/getEmailMessages.ts
//
// Used by lib/email/reservationEmails.ts, which runs outside React and
// outside any single request's locale — the guest's chosen locale and
// the admin's are different requests entirely, so this can't rely on
// next-intl's getRequestConfig (see lib/i18n/request.ts). Reads the
// message JSON files directly instead.

import esMessages from "@/messages/es.json";
import enMessages from "@/messages/en.json";
import ptMessages from "@/messages/pt.json";

const MESSAGES = { es: esMessages, en: enMessages, pt: ptMessages } as const;

export type SupportedLocale = keyof typeof MESSAGES;

export function resolveLocale(input: unknown): SupportedLocale {
  return input === "en" || input === "pt" || input === "es" ? input : "es";
}

export function getEmailMessages(locale: SupportedLocale) {
  return MESSAGES[locale].Email;
}