"use client";

// app/admin/layout.tsx
//
// Wraps every page under /admin/*. Deliberately renders no nav chrome on
// /admin/login, since that page shouldn't look like it's already "inside"
// the panel before the admin has actually logged in.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ConfirmProvider } from "../components/ConfirmProvider";

const NAV_ITEMS = [
  { href: "/admin", label: "Disponibilidad" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/propiedades", label: "Propiedades" },
  { href: "/admin/sitio", label: "Sitio" },
  { href: "/admin/traducciones", label: "Traducciones" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Cerrar el menú al navegar a otra página
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Cerrar con la tecla Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);
  // Bloquear el scroll del body mientras el menú está abierto
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);
  // Cerrar el menú si la pantalla pasa a desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="relative z-40 border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3 md:px-6 py-3 md:py-4">
          {/* Nav desktop */}
          <nav className="hidden md:flex gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Título mobile: muestra la sección actual */}
          <span className="md:hidden uppercase font-gotham text-xl font-semibold text-zinc-900">
            {NAV_ITEMS.find((i) => i.href === pathname)?.label ?? "Admin"}
          </span>

          {/* Botón hamburguesa (solo mobile) */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-menu"
            className="md:hidden rounded-md border border-zinc-300 p-2 text-zinc-700 hover:bg-zinc-100"
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

          <div className="hidden md:flex gap-1">
            <Link
              type="button"
              href="/"
              className="hidden md:block rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
            >
              Volver al sitio
            </Link>
            {/* Logout desktop */}
            <button
              type="button"
              onClick={handleLogout}
              className="hidden md:block rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Panel mobile */}
        {menuOpen && (
          <div
            id="admin-mobile-menu"
            className="md:hidden absolute inset-x-0 top-full border-b border-zinc-200 bg-zinc-50 shadow-lg"
          >
            <nav className="flex flex-col gap-1 px-4 py-3">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-black text-white"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                type="button"
                href="/"
                className="mt-2 rounded-md border border-zinc-300 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Volver al sitio
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 rounded-md border border-zinc-300 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cerrar sesión
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Fondo para cerrar al tocar afuera (mobile) */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-xs"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="mx-auto max-w-5xl px-3 md:px-6 py-3 md:py-8">
        <ConfirmProvider>{children}</ConfirmProvider>
      </main>
    </div>
  );
}
