import { NextIntlClientProvider } from "next-intl";
import { CurrencyProvider } from "../components/CurrencyProvider";

export default function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <NextIntlClientProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </NextIntlClientProvider>
  );
}
