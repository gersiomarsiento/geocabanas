// app/reserva-confirmada/page.tsx
//
// Using Promise-based searchParams, matching the same pattern your
// [slug] and [id] routes already use elsewhere in this project. If your
// Next.js version doesn't need that here, drop the `await` and read
// `searchParams.id` directly instead.

import Link from "next/link";

export default async function ReservaConfirmadaPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-3 text-xl font-semibold">¡Solicitud recibida!</h1>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          En breve vas a recibir un email con la información para confirmar tu
          reserva. Revisá tu bandeja de entrada (y la carpeta de spam, por las
          dudas).
        </p>

        {id && (
          <p className="mt-4 text-xs text-zinc-400">
            Número de referencia: <span className="font-mono">{id}</span>
          </p>
        )}

        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
