"use client";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { CaretSmallIcon, FlagEnIcon, FlagEsIcon, FlagPtIcon } from "./icons";
import { useLocale } from "next-intl";

const LANGUAGES = [
  { code: "es", icon: FlagEsIcon, label: "ES" },
  { code: "en", icon: FlagEnIcon, label: "EN" },
  { code: "pt", icon: FlagPtIcon, label: "PT" },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const selectedLanguage = LANGUAGES.find((lang) => lang.code === locale);
  const FlagIcon = selectedLanguage?.icon;

  function handleChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="relative min-h-9 md:min-h-0 w-fit flex items-center gap-2 rounded-md border border-white/30 bg-primary px-2 py-1 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
      {FlagIcon && <FlagIcon />}

      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Idioma / Language"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {LANGUAGES.map((lang) => (
          <option className="text-black" key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
      <span>{locale.toUpperCase()}</span>
      <CaretSmallIcon className="text-white" />
    </div>
  );
}
