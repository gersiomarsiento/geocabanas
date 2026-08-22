// lib/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";

function deepMerge(base: unknown, override: unknown): unknown {
  if (typeof base !== "object" || base === null || Array.isArray(base)) {
    return override ?? base;
  }

  const result: Record<string, unknown> = { ...(base as object) };

  for (const key of Object.keys(override ?? {})) {
    result[key] = deepMerge(
      (base as Record<string, unknown>)[key],
      (override as Record<string, unknown>)[key],
    );
  }

  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? "es";

  const es = (await import("@/messages/es.json")).default;

  const messages =
    locale === "es"
      ? es
      : deepMerge(es, (await import(`@/messages/${locale}.json`)).default);

  return {
    locale,
    messages: messages as AbstractIntlMessages,
  };
});
