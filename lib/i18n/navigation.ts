import { createNavigation } from "next-intl/navigation";

export const locales = ["es", "en", "pt"] as const;

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  localePrefix: "as-needed",
  defaultLocale: "es",
});
