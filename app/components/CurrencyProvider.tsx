"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  BASE_CURRENCY,
  DEFAULT_EXCHANGE_RATES,
  type Currency,
  type ExchangeRates,
} from "@/lib/currency";

type CurrencyContextType = {
  currency: Currency;
  rates: ExchangeRates;
  activeCurrencies: Currency[];
  isReady: boolean;
  setCurrency: (currency: Currency) => void;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

interface SiteSettingsResponse {
  exchangeRateUyu?: number;
  exchangeRateBrl?: number;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(BASE_CURRENCY);
  const [isReady, setIsReady] = useState(false);
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_EXCHANGE_RATES);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/site-settings");

        if (!response.ok) {
          throw new Error("No se pudieron cargar las tasas de cambio");
        }

        const data = (await response.json()) as SiteSettingsResponse;

        const newRates: ExchangeRates = {
          USD: 1,
          UYU:
            typeof data.exchangeRateUyu === "number" &&
            data.exchangeRateUyu >= 0
              ? data.exchangeRateUyu
              : DEFAULT_EXCHANGE_RATES.UYU,
          BRL:
            typeof data.exchangeRateBrl === "number" &&
            data.exchangeRateBrl >= 0
              ? data.exchangeRateBrl
              : DEFAULT_EXCHANGE_RATES.BRL,
        };

        setRates(newRates);

        const savedCurrency = localStorage.getItem("currency");

        const savedCurrencyIsValid =
          savedCurrency === "USD" ||
          (savedCurrency === "UYU" && newRates.UYU > 0) ||
          (savedCurrency === "BRL" && newRates.BRL > 0);

        if (savedCurrencyIsValid) {
          setCurrencyState(savedCurrency);
        } else {
          setCurrencyState(BASE_CURRENCY);
          localStorage.setItem("currency", BASE_CURRENCY);
        }
      } catch (error) {
        console.error("Failed to load exchange rates:", error);

        // Si falla la carga, usamos las tasas por defecto.
        // También recuperamos la moneda guardada si es válida.
        const savedCurrency = localStorage.getItem("currency");

        if (
          savedCurrency === "USD" ||
          savedCurrency === "UYU" ||
          savedCurrency === "BRL"
        ) {
          setCurrencyState(savedCurrency);
        }
      } finally {
        setIsReady(true);
      }
    }

    void loadSettings();
  }, []);

  const activeCurrencies: Currency[] = [
    "USD",
    ...(rates.UYU > 0 ? ["UYU" as const] : []),
    ...(rates.BRL > 0 ? ["BRL" as const] : []),
  ];

  function setCurrency(nextCurrency: Currency) {
    if (!activeCurrencies.includes(nextCurrency)) {
      return;
    }

    setCurrencyState(nextCurrency);
    localStorage.setItem("currency", nextCurrency);
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        rates,
        activeCurrencies,
        isReady,
        setCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error("useCurrency debe usarse dentro de CurrencyProvider");
  }

  return context;
}
