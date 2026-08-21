"use client";

// app/admin/layout.tsx
//
// Wraps every page under /admin/*. Deliberately renders no nav chrome on
// /admin/login, since that page shouldn't look like it's already "inside"
// the panel before the admin has actually logged in.
//
// Links point to pages that don't exist yet (Propiedades, Imágenes) —
// those are the next steps. This file only builds the shell.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Disponibilidad" },
  { href: "/admin/propiedades", label: "Propiedades" },
  { href: "/admin/sitio", label: "Sitio" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

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
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <nav className="flex gap-1">
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

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm  "
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 md:px-6 py-8">{children}</main>
    </div>
  );
}
