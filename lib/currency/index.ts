export const BASE_CURRENCY = "USD" as const;

export const SUPPORTED_CURRENCIES = ["USD", "UYU", "BRL"] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export type ExchangeRates = Record<Currency, number>;

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 1,
  UYU: 42.5,
  BRL: 5.4,
};

export function convertFromUSD(
  amount: number,
  currency: Currency,
  rates: ExchangeRates,
): number {
  return amount * rates[currency];
}

export function formatCurrency(
  amount: number,
  currency: Currency,
  locale = "es-UY",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
