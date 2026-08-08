"use client";

// app/admin/page.tsx
//
// Placeholder — confirms the auth flow works end to end.
// Next step replaces this with the actual availability/price editor (item #4).

import { useRouter } from "next/navigation";

export default function AdminHome() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Panel de administración</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Login funcionando. El editor de disponibilidad y precios va acá.
      </p>
      <button
        onClick={handleLogout}
        className="mt-6 rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
