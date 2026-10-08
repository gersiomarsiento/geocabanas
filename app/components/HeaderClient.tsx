"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import Image from "next/image";

import { type Currency } from "@/lib/currency";
import { useCurrency } from "../components/CurrencyProvider";

export default function HeaderClient({ logoUrl }: { logoUrl: string | null }) {
  const t = useTranslations("Header");
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;

      setAtTop(y < 200);

      // Only toggle hide/show after a small delta to avoid jitter
      if (Math.abs(y - lastY) > 8) {
        // Never hide while at the very top, or while the mobile drawer is open
        setHidden(y > lastY && y > 80);
        lastY = y;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { currency, setCurrency, activeCurrencies, isReady } = useCurrency();

  const openMenu = () => {
    setDrawerMounted(true);
    requestAnimationFrame(() => {
      setMenuOpen(true);
    });
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    if (menuOpen) return;
    const timeout = setTimeout(() => {
      setDrawerMounted(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [menuOpen]);

  function handleCurrencyChange(value: string) {
    setCurrency(value as Currency);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-20 transition-all duration-300 ease-in-out ${
            atTop ? "bg-linear-to-b from-black/50 to-transparent" : "bg-primary shadow-md"
        } ${hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className="flex md:max-w-360 items-center justify-between p-3 md:px-6 mx-auto">
          <h2 className="text-xl font-bold tracking-tight text-primary-foreground md:text-2xl">
            {logoUrl ? (
              <a href="#">
                <Image
                  src={logoUrl}
                  alt="Geocabañas"
                  width={160}
                  height={40}
                  priority
                  className="h-14 w-auto md:h-18"
                />
              </a>
            ) : (
              <span className="text-xl font-bold tracking-tight text-primary-foreground md:text-2xl">
                GEOCABAÑAS
              </span>
            )}
          </h2>

          {/* Desktop */}
          <div className="hidden items-center gap-6 md:flex">
            <nav className="flex items-center gap-6 uppercase">
              {/* <a
                href="#quienes-somos"
                className="text-sm font-medium text-primary-foreground transition-colors hover:text-accent-300"
              >
                {t("nuestrasCabanas")}
              </a> */}

              <a
                href="#contact-section"
                className="text-sm font-medium text-primary-foreground transition-colors hover:text-accent-300"
              >
                {t("contacto")}
              </a>
              <a
                href="#reservar-button"
                className="bg-secondary-500 text-white w-fit rounded-md  px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                {t("reservar")}
              </a>

            </nav>
            {/* Currency selector */}
            {!isReady ? (
              <div
                className="h-9 w-17 animate-pulse rounded-md bg-background/10"
                aria-label={t("cargandoMoneda")}
              />
            ) : (
              <select
                value={currency}
                onChange={(event) => handleCurrencyChange(event.target.value)}
                aria-label={t("seleccionarMoneda")}
                className={`cursor-pointer rounded-md border border-white/30 px-2 py-1 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-accent duration-300 ${
                  atTop ? "bg-transparent backdrop-blur-sm" : "bg-primary"
                }`}
              >
                {activeCurrencies.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-background text-primary"
                  >
                    {item}
                  </option>
                ))}
              </select>
            )}
            <LanguageSwitcher />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={openMenu}
            aria-label={t("abrirMenu")}
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-md md:hidden"
          >
            <div className="flex flex-col gap-1">
              <span className="block h-0.5 w-6 bg-background" />
              <span className="block h-0.5 w-6 bg-background" />
              <span className="block h-0.5 w-6 bg-background" />
            </div>
          </button>
        </div>
      </header>
      {/* Mobile drawer */}
      {drawerMounted && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label={t("cerrarMenu")}
            onClick={closeMenu}
            className={`absolute inset-0 bg-primary/40 transition-opacity duration-300 ease-in-out ${
              menuOpen ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Drawer */}
          <nav
            className={`flex flex-col absolute right-0 top-0 h-full w-72 bg-background p-2 shadow-xl transition-transform duration-300 ease-in-out ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div>
              <div className="mb-10 flex justify-end">
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label={t("cerrarMenu")}
                  className="flex h-8 w-8 items-center justify-center text-2xl text-primary"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <a
                href="#reservar-button"
                onClick={closeMenu}
                className="border-b border-zinc-200 py-4 text-base font-medium text-primary"
              >
                {t("reservar")}
              </a>

              <a
                href="#quienes-somos"
                onClick={closeMenu}
                className="border-b border-zinc-200 py-4 text-base font-medium text-primary"
              >
                {t("nuestrasCabanas")}
              </a>

              <a
                href="#contact-section"
                onClick={closeMenu}
                className="py-4 text-base font-medium text-primary"
              >
                {t("contacto")}
              </a>
            </div>
            {/* Currency selector mobile */}
            <div className="flex justify-between mt-auto">
              <div className="py-4">
                <p className="mb-3 text-sm font-medium text-zinc-500">
                  {t("moneda")}
                </p>
                {!isReady ? (
                  <div
                    className="h-9 w-17 animate-pulse rounded-md bg-background/10"
                    aria-label={t("cargandoMoneda")}
                  />
                ) : (
                  <div className="flex gap-2">
                    {activeCurrencies.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrency(item)}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                          currency === item
                            ? "bg-primary text-primary-foreground"
                            : "bg-zinc-100 text-primary"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="py-4">
                <p className="mb-3 text-sm font-medium text-zinc-500">
                  {t("idioma")}
                </p>
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
