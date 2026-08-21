"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { type Currency } from "@/lib/currency";
import { useCurrency } from "../components/CurrencyProvider";

export default function HeaderClient({ logoUrl }: { logoUrl: string | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);

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
    // Drawer opne/close
    if (menuOpen) return;

    const timeout = setTimeout(() => {
      setDrawerMounted(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [menuOpen]);

  useEffect(() => {
    // Scroll lock
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
    <header className="absolute inset-x-0 top-0 z-20 bg-primary">
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
                className="h-10 w-auto md:h-14"
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
          <nav className="flex items-center gap-6">
            <a
              href="#reservar-button"
              className="text-sm font-medium text-primary-foreground hover:underline"
            >
              Reservar
            </a>

            <a
              href="#quienes-somos"
              className="text-sm font-medium text-primary-foreground hover:underline"
            >
              Nuestras cabañas
            </a>

            <a
              href="#contact-section"
              className="text-sm font-medium text-primary-foreground hover:underline"
            >
              Contacto
            </a>
          </nav>

          {/* Currency selector */}
          {!isReady ? (
            <div
              className="h-9 w-17 animate-pulse rounded-md bg-background/10"
              aria-label="Cargando moneda"
            />
          ) : (
            <select
              value={currency}
              onChange={(event) => handleCurrencyChange(event.target.value)}
              aria-label="Seleccionar moneda"
              className="cursor-pointer rounded-md border border-white/30 bg-primary px-2 py-1 text-sm font-medium text-primary-foreground outline-none"
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
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={openMenu}
          aria-label="Abrir menú"
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

      {/* Mobile drawer */}
      {drawerMounted && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={closeMenu}
            className={`absolute inset-0 bg-primary/40 transition-opacity duration-300 ease-in-out ${
              menuOpen ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Drawer */}
          <nav
            className={`absolute right-0 top-0 h-full w-72 bg-background p-2 shadow-xl transition-transform duration-300 ease-in-out ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div>
              <div className="mb-10 flex justify-end">
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Cerrar menú"
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
                Reservar
              </a>

              <a
                href="#quienes-somos"
                onClick={closeMenu}
                className="border-b border-zinc-200 py-4 text-base font-medium text-primary"
              >
                Nuestras cabañas
              </a>

              <a
                href="#contact-section"
                onClick={closeMenu}
                className="py-4 text-base font-medium text-primary"
              >
                Contacto
              </a>
            </div>
            {/* Currency selector mobile */}
            <div className="py-4">
              <p className="mb-3 text-sm font-medium text-zinc-500">Moneda</p>
              {!isReady ? (
                <div
                  className="h-9 w-17 animate-pulse rounded-md bg-background/10"
                  aria-label="Cargando moneda"
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
          </nav>
        </div>
      )}
    </header>
  );
}
