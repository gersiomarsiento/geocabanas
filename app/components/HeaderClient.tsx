"use client";

import { useState } from "react";
import Image from "next/image";

export default function HeaderClient({ logoUrl }: { logoUrl: string | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="bg-black">
      <div className="flex md:max-w-360 items-center justify-between p-3 md:px-6 mx-auto">
        <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
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
            <h2 className="text-xl font-bold tracking-tight text-white bg-black md:text-2xl">
              GEOCABAÑAS
            </h2>
          )}
        </h2>
        {/* Desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#reservar-button"
            className="text-sm font-medium text-white hover:underline"
          >
            Reservar
          </a>
          <a
            href="#quienes-somos"
            className="text-sm font-medium text-white hover:underline"
          >
            Nuestras cabañas
          </a>
          <a
            href="#contact-section"
            className="text-sm font-medium text-white hover:underline"
          >
            Contacto
          </a>
        </nav>
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          className="flex h-8 w-8 items-center justify-center rounded-md md:hidden"
        >
          <div className="flex flex-col gap-1">
            <span className="block h-0.5 w-6 bg-white" />
            <span className="block h-0.5 w-6 bg-white" />
            <span className="block h-0.5 w-6 bg-white" />
          </div>
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={closeMenu}
            className="absolute inset-0 bg-black/40"
          />

          {/* Drawer */}
          <nav className="absolute right-0 top-0 h-full w-72 bg-white p-2 shadow-xl">
            <div>
              <div className="mb-10 flex justify-end">
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Cerrar menú"
                  className="flex h-8 w-8 items-center justify-center text-2xl text-black"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <a
                href="#reservar-button"
                onClick={closeMenu}
                className="border-b border-zinc-200 py-4 text-base font-medium text-black"
              >
                Reservar
              </a>

              <a
                href="#quienes-somos"
                onClick={closeMenu}
                className="border-b border-zinc-200 py-4 text-base font-medium text-black"
              >
                Nuestras cabañas
              </a>

              <a
                href="#contact-section"
                onClick={closeMenu}
                className="py-4 text-base font-medium text-black"
              >
                Contacto
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
