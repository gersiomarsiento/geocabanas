"use client";

// app/admin/reservas/page.tsx

import { useEffect, useMemo, useState } from "react";
import type {
  AdminReservation,
  ReservationStatus,
} from "@/types/admin-availability";
import { whatsappUrl } from "@/lib/whatsapp";

const TABS: { status: ReservationStatus; label: string }[] = [
  { status: "requested", label: "Solicitudes" },
  { status: "pending", label: "Pendientes" },
  { status: "confirmed", label: "Confirmadas" },
  { status: "cancelled", label: "Canceladas" },
];

const BADGE: Record<string, { label: string; className: string }> = {
  requested: { label: "Solicitud", className: "bg-amber-100 text-amber-800" },
  pending: { label: "Pendiente", className: "bg-sky-100 text-sky-800" },
  confirmed: {
    label: "Confirmada",
    className: "bg-emerald-100 text-emerald-800",
  },
  cancelled: { label: "Cancelada", className: "bg-zinc-200 text-zinc-600" },
  expired: { label: "Vencida", className: "bg-zinc-200 text-zinc-600" },
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-UY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function nightsBetween(start: string, end: string) {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  return Math.round(
    (new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()) /
      86_400_000,
  );
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(
      amount,
    );
  }
}

type Dialog = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (value: boolean) => void;
};

type Group = { key: string; legs: AdminReservation[] };

export default function ReservasPage() {
  const [tab, setTab] = useState<ReservationStatus>("requested");
  const [rows, setRows] = useState<AdminReservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  function confirmDialog(options: Omit<Dialog, "resolve">): Promise<boolean> {
    return new Promise((resolve) => setDialog({ ...options, resolve }));
  }

  useEffect(() => {
    let ignore = false;
    setRows(null);
    setError(null);

    fetch(`/api/admin/reservations?status=${tab}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las reservas");
        return res.json() as Promise<AdminReservation[]>;
      })
      .then((data) => {
        if (!ignore) setRows(data);
      })
      .catch((e) => {
        if (!ignore) setError(e.message);
      });

    return () => {
      ignore = true;
    };
  }, [tab, reloadKey]);

  // Legs of one group booking render in a single card.
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, AdminReservation[]>();
    for (const r of rows ?? []) {
      const key = r.groupId ?? r.id;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return Array.from(map, ([key, legs]) => ({ key, legs }));
  }, [rows]);

  async function patchStatus(
    id: string,
    status: "confirmed" | "cancelled",
    force = false,
  ) {
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, force }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function changeStatus(
    r: AdminReservation,
    status: "confirmed" | "cancelled",
  ) {
    if (status === "cancelled") {
      const ok = await confirmDialog({
        title: "Cancelar reserva",
        message: `¿Cancelar la reserva de ${r.guestName} en ${r.propertyName} (${formatDate(r.startDate)} → ${formatDate(r.endDate)})? Las fechas quedarán libres.`,
        confirmLabel: "Cancelar la reserva",
        cancelLabel: "Volver",
      });
      if (!ok) return;
    }

    setBusyId(r.id);
    setMessage(null);

    try {
      let { res, data } = await patchStatus(r.id, status);

      if (res.status === 409 && data.error === "ical_conflict") {
        const ok = await confirmDialog({
          title: "Conflicto con Booking.com / Airbnb",
          message: `Estas fechas figuran como ocupadas en otra plataforma: ${(
            data.conflictDates as string[]
          ).join(
            ", ",
          )}. Si confirmás, acordate de bloquearlas o resolver el conflicto allá.`,
          confirmLabel: "Confirmar de todas formas",
          cancelLabel: "Volver",
        });
        if (!ok) return;
        ({ res, data } = await patchStatus(r.id, status, true));
      }

      if (!res.ok) {
        setMessage({
          type: "error",
          text:
            data.message ?? data.error ?? "No se pudo actualizar la reserva",
        });
        return;
      }

      const base =
        status === "confirmed" ? "Reserva confirmada." : "Reserva cancelada.";
      setMessage(
        data.emailSent === true
          ? { type: "success", text: `${base} Se avisó al huésped por email.` }
          : {
              type: "error",
              text: `${base} Pero no se pudo enviar el email al huésped.`,
            },
      );
      setReloadKey((k) => k + 1);
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="small mb-6 text-xl font-semibold">Reservas</h1>

      <div className="mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.status}
            type="button"
            onClick={() => {
              setTab(t.status);
              setMessage(null);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.status
                ? "bg-foreground text-background"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <p
          className={`mb-4 text-sm font-medium ${
            message.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !rows ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
          No hay reservas en esta categoría.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map(({ key, legs }) => {
            const first = legs[0];
            const wa = whatsappUrl(first.guestPhone);
            return (
              <div
                key={key}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground md:px-6">
                  <div>
                    <p className="font-semibold">{first.guestName}</p>
                    <p className="text-sm opacity-80">
                      {first.guestEmail}
                      {first.guestPhone ? ` · ${first.guestPhone}` : ""}
                    </p>
                    {first.groupId && (
                      <p className="font-mono text-xs opacity-60">
                        Ref. {first.groupId}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {legs.length > 1 && (
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
                        Grupo de {legs.length}
                      </span>
                    )}
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-[#25D366] px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <ul className="divide-y divide-zinc-200">
                  {legs.map((r) => {
                    const badge = BADGE[r.status];
                    const busy = busyId === r.id;
                    const canConfirm =
                      r.status === "requested" || r.status === "pending";
                    const canCancel =
                      r.status !== "cancelled" && r.status !== "expired";
                    return (
                      <li
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6"
                      >
                        <div className="min-w-0 space-y-0.5 text-sm">
                          <p className="flex items-center gap-2 font-semibold">
                            {r.propertyName}
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </p>
                          <p className="text-zinc-600">
                            {formatDate(r.startDate)} → {formatDate(r.endDate)}{" "}
                            · {nightsBetween(r.startDate, r.endDate)} noches
                          </p>
                          <p className="text-zinc-600">
                            Total {formatMoney(r.totalPrice, r.currency)}
                            {r.depositAmount > 0 &&
                              ` · Seña ${formatMoney(r.depositAmount, r.currency)}`}
                          </p>
                          <p className="font-mono text-xs text-zinc-400">
                            {r.id}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {canConfirm && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => changeStatus(r, "confirmed")}
                              className="rounded-md bg-foreground px-3 py-1.5 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {busy ? "…" : "Confirmar"}
                            </button>
                          )}
                          {canCancel && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => changeStatus(r, "cancelled")}
                              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <p className="text-base font-semibold text-zinc-900">
              {dialog.title}
            </p>
            <p className="mt-2 text-sm text-zinc-600">{dialog.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  dialog.resolve(false);
                  setDialog(null);
                }}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                {dialog.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  dialog.resolve(true);
                  setDialog(null);
                }}
                className="rounded-md bg-foreground px-3 py-1.5 text-sm font-semibold text-background hover:opacity-90"
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
