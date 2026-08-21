"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AvailabilityResponse,
  BulkUpdatePayload,
  DayRate,
  Property,
  PropertySettingsUpdate,
} from "@/types/admin-availability";
import {
  type DateParts,
  toDate,
  toDateKey,
  enumerateRange,
  startOfToday,
  buildCalendarDays,
} from "@/lib/calendar/dates";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatDisplayDate({ year, month, day }: DateParts) {
  return `${day} ${MONTHS[month]} ${year}`;
}

function currencyFormatter(currency: string) {
  try {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  } catch {
    return new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });
  }
}

type PatchResult = {
  ok: boolean;
  updatedDates: string[];
  skippedDates: {
    date: string;
    reservation: {
      id: string;
      guestName: string;
      guestEmail: string;
      guestPhone: string | null;
      status: string;
      startDate: string;
      endDate: string;
    };
  }[];
  icalConflictDates: string[];
  failedDates: { date: string; error: string }[];
};

async function submitAvailabilityPatch(
  payload: BulkUpdatePayload & { confirmIcalOverride?: boolean },
): Promise<PatchResult> {
  const res = await fetch("/api/admin/availability", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo guardar el cambio");
  return res.json();
}

export default function AdminAvailabilityCalendar() {
  const today = startOfToday();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // --- Properties (for admins managing more than one property/room) ---
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [propertiesError, setPropertiesError] = useState<string | null>(null);

  const selectedProperty = useMemo(
    () => properties?.find((p) => p.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );

  useEffect(() => {
    fetch("/api/admin/properties")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las propiedades");
        return res.json() as Promise<Property[]>;
      })
      .then((data) => {
        setProperties(data);
        if (data.length > 0) setSelectedPropertyId(data[0].id);
      })
      .catch((e) => setPropertiesError(e.message));
  }, []);

  // --- Rates for the visible month ---
  const [rates, setRates] = useState<Map<string, DayRate> | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPropertyId) return;
    setRates(null);
    setRatesError(null);
    const params = new URLSearchParams({
      propertyId: selectedPropertyId,
      year: String(viewYear),
      month: String(viewMonth + 1), // API takes 1-indexed months
    });
    fetch(`/api/admin/availability?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la disponibilidad");
        return res.json() as Promise<AvailabilityResponse>;
      })
      .then((data) => {
        const map = new Map<string, DayRate>();
        for (const day of data.days) map.set(day.date, day);
        setRates(map);
      })
      .catch((e) => setRatesError(e.message));
  }, [selectedPropertyId, viewYear, viewMonth]);

  // --- Date selection (same click-a-start-then-an-end pattern as the visitor calendar) ---
  const [selectionStart, setSelectionStart] = useState<DateParts | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<DateParts | null>(null);
  const [selectionLocked, setSelectionLocked] = useState(false); // true once a full range is chosen

  const days = buildCalendarDays(viewYear, viewMonth);
  const todayKey = toDateKey({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  });

  function getRate(key: string): DayRate {
    return (
      rates?.get(key) ?? {
        date: key,
        available: true,
        reserved: false,
        price: null,
        minStay: null,
      }
    );
  }

  function handleDayClick(day: number) {
    const clicked: DateParts = { year: viewYear, month: viewMonth, day };
    const clickedTime = toDate(clicked).getTime();
    const rate = getRate(toDateKey(clicked));

    // Past days and days already tied to a real guest reservation can't be edited here.
    if (clickedTime < today.getTime() || rate.reserved) return;

    setFormMessage(null);

    if (!selectionStart || selectionLocked) {
      setSelectionStart(clicked);
      setSelectionEnd(clicked);
      setSelectionLocked(false);
      return;
    }

    const startTime = toDate(selectionStart).getTime();
    if (clickedTime < startTime) {
      setSelectionStart(clicked);
      setSelectionEnd(clicked);
    } else {
      setSelectionEnd(clicked);
      setSelectionLocked(true);
    }
  }

  function clearSelection() {
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionLocked(false);
    setFormMessage(null);
  }

  function goToPreviousMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function getDayState(day: number) {
    const parts: DateParts = { year: viewYear, month: viewMonth, day };
    const key = toDateKey(parts);
    const time = toDate(parts).getTime();
    const isPast = time < today.getTime();
    const isToday = key === todayKey;
    const rate = getRate(key);
    const occupied = rate.reserved || !rate.available;

    let isSelected = false;
    let isInRange = false;
    if (selectionStart && selectionEnd) {
      const startTime = toDate(selectionStart).getTime();
      const endTime = toDate(selectionEnd).getTime();
      isSelected =
        key === toDateKey(selectionStart) || key === toDateKey(selectionEnd);
      isInRange = time > startTime && time < endTime;
    }

    return { isPast, isToday, isSelected, isInRange, occupied, rate };
  }

  // --- Bulk edit form, prefilled from the current selection ---
  const [availableInput, setAvailableInput] = useState<"available" | "blocked">(
    "available",
  );
  const [priceInput, setPriceInput] = useState("");
  const [minStayInput, setMinStayInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Prefill the form whenever the selection settles on a single day, so
  // single-day edits show the day's real current values.
  useEffect(() => {
    if (!selectionStart || !selectionEnd) return;
    const sameDay = toDateKey(selectionStart) === toDateKey(selectionEnd);
    if (!sameDay || !rates) return;
    const rate = getRate(toDateKey(selectionStart));
    setAvailableInput(rate.available ? "available" : "blocked");
    setPriceInput(rate.price != null ? String(rate.price) : "");
    setMinStayInput(rate.minStay != null ? String(rate.minStay) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionStart, selectionEnd, rates]);

  async function applyToSelection() {
    if (!selectedPropertyId || !selectionStart || !selectionEnd) return;
    setSaving(true);
    setFormMessage(null);

    const basePayload: BulkUpdatePayload = {
      propertyId: selectedPropertyId,
      startDate: toDateKey(selectionStart),
      endDate: toDateKey(selectionEnd),
      available: availableInput === "available",
      price: priceInput.trim() === "" ? null : Number(priceInput),
      minStay: minStayInput.trim() === "" ? null : Number(minStayInput),
    };

    try {
      let result = await submitAvailabilityPatch(basePayload);

      // Reservation conflicts: the only way through is cancelling the
      // reservation itself. Ask once per unique reservation in the range.
      if (result.skippedDates.length > 0) {
        const uniqueReservations = Array.from(
          new Map(
            result.skippedDates.map((s) => [s.reservation.id, s.reservation]),
          ).values(),
        );

        for (const reservation of uniqueReservations) {
          const wantsToCancel = window.confirm(
            `${reservation.guestName} tiene una reserva ${
              reservation.status === "pending" ? "pendiente" : "confirmada"
            } del ${reservation.startDate} al ${reservation.endDate}.\n\n¿Cancelar esta reserva para liberar esas fechas?`,
          );

          if (wantsToCancel) {
            const cancelRes = await fetch(
              `/api/admin/reservations/${reservation.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" }),
              },
            );
            if (!cancelRes.ok) {
              setFormMessage({
                type: "error",
                text: `No se pudo cancelar la reserva de ${reservation.guestName}.`,
              });
            }
          }
        }

        // Re-run the same edit now that any confirmed cancellations went through.
        result = await submitAvailabilityPatch(basePayload);
      }

      // iCal conflicts (Booking.com/Airbnb): optional, explicit override —
      // never automatic.
      if (result.icalConflictDates.length > 0) {
        const wantsToOverride = window.confirm(
          `Estas fechas figuran como ocupadas en Booking.com o Airbnb:\n${result.icalConflictDates.join(
            ", ",
          )}\n\nSi continuás, solo se modificarán en tu sitio — acordate de ajustarlas también en esa plataforma para evitar inconsistencias.\n\n¿Continuar de todas formas?`,
        );

        if (wantsToOverride) {
          result = await submitAvailabilityPatch({
            ...basePayload,
            confirmIcalOverride: true,
          });
        }
      }

      // Only reflect dates that actually changed — anything still
      // skipped/declined keeps showing its real, unchanged state.
      setRates((prev) => {
        const next = new Map(prev ?? []);
        for (const key of result.updatedDates) {
          next.set(key, {
            date: key,
            available: basePayload.available!,
            reserved: next.get(key)?.reserved ?? false,
            price: basePayload.price ?? null,
            minStay: basePayload.minStay ?? null,
          });
        }
        return next;
      });

      if (result.failedDates.length > 0) {
        setFormMessage({
          type: "error",
          text: `Algunas fechas no se pudieron guardar (${result.failedDates.length}).`,
        });
      } else if (result.updatedDates.length > 0) {
        setFormMessage({ type: "success", text: "Cambios guardados." });
        clearSelection();
      } else {
        setFormMessage({ type: "error", text: "No se guardó ningún cambio." });
      }
    } catch (e) {
      setFormMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Error desconocido",
      });
    } finally {
      setSaving(false);
    }
  }

  // --- Property-level settings (default price, default min stay, min reservation fee) ---
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<PropertySettingsUpdate>(
    {},
  );
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedProperty) return;
    setSettingsDraft({
      defaultPrice: selectedProperty.defaultPrice,
      defaultMinStay: selectedProperty.defaultMinStay,
      minReservationFee: selectedProperty.minReservationFee,
    });
  }, [selectedProperty]);

  async function saveSettings() {
    if (!selectedProperty) return;
    setSettingsSaving(true);
    setSettingsMessage(null);
    try {
      const res = await fetch(`/api/admin/properties/${selectedProperty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsDraft),
      });
      if (!res.ok) throw new Error("No se pudo guardar la configuración");
      setProperties(
        (prev) =>
          prev?.map((p) =>
            p.id === selectedProperty.id ? { ...p, ...settingsDraft } : p,
          ) ?? null,
      );
      setSettingsMessage({ type: "success", text: "Configuración guardada." });
    } catch (e) {
      setSettingsMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Error desconocido",
      });
    } finally {
      setSettingsSaving(false);
    }
  }

  const money = currencyFormatter(selectedProperty?.currency ?? "UYU");
  const selectionLabel =
    selectionStart && selectionEnd
      ? toDateKey(selectionStart) === toDateKey(selectionEnd)
        ? formatDisplayDate(selectionStart)
        : `${formatDisplayDate(selectionStart)} → ${formatDisplayDate(selectionEnd)}`
      : "Ningún día seleccionado";

  if (propertiesError) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-3 md:p-6 text-center text-sm text-zinc-500 shadow-sm    ">
        No se pudieron cargar las propiedades en este momento.
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Property / room selector — only shown when the admin manages more than one */}
      {properties && properties.length > 1 && (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm ">
          <label
            htmlFor="property-select"
            className="text-sm font-medium text-zinc-600  "
          >
            Propiedad
          </label>
          <select
            id="property-select"
            value={selectedPropertyId ?? ""}
            onChange={(e) => {
              setSelectedPropertyId(e.target.value);
              clearSelection();
            }}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm    "
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full rounded-xl border border-zinc-200 bg-white p-3 md:p-6 shadow-sm    ">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Mes anterior"
              className="rounded-md px-3 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              ←
            </button>
            <p className="text-lg font-semibold">
              {MONTHS[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Mes siguiente"
              className="rounded-md px-3 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              →
            </button>
          </div>
          {/* Color legend */}
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-100 ring-1 ring-inset ring-emerald-300" />
              Disponible
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-red-100 ring-1 ring-inset ring-red-300 " />
              No disponible / ocupado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-zinc-100  " />
              Fecha pasada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-foreground" />
              Seleccionado
            </span>
          </div>
          {ratesError ? (
            <p className="py-8 text-center text-sm text-red-600 ">{ratesError}</p>
          ) : !rates ? (
            <p className="py-8 text-center text-sm text-zinc-500  ">
              Cargando disponibilidad…
            </p>
          ) : (
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="py-2 font-medium text-zinc-500  ">
                  {weekday}
                </div>
              ))}
              {days.map((day, index) => {
                if (day === null) return <div key={index} aria-hidden />;
                const { isPast, isToday, isSelected, isInRange, occupied, rate } =
                  getDayState(day);
                const isDisabled = isPast || rate.reserved;
                const price = rate.price ?? selectedProperty?.defaultPrice;
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={isDisabled}
                    title={
                      rate.reserved
                        ? "Reservado"
                        : !rate.available
                          ? "Bloqueado por el administrador"
                          : undefined
                    }
                    onClick={() => handleDayClick(day)}
                    className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md transition-colors ${
                      isPast
                        ? "cursor-not-allowed text-zinc-300 "
                        : isSelected
                          ? "bg-foreground font-semibold text-background"
                          : isInRange
                            ? "bg-zinc-200 text-zinc-800  "
                            : occupied
                              ? `bg-red-100 text-red-700 ring-1 ring-inset ring-red-300  ${
                                  rate.reserved
                                    ? "cursor-not-allowed"
                                    : "hover:bg-red-200"
                                }`
                              : `bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100  ${
                                  isToday ? "ring-2 ring-foreground/40" : ""
                                }`
                    }`}
                  >
                    <span>{day}</span>
                    {!isPast && price != null && (
                      <span className="text-[10px] font-normal leading-none opacity-80">
                        {money.format(price)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {/* Bulk / single-day edit panel */}
        <div className="w-full rounded-xl border border-zinc-200 bg-white p-3 md:p-6 shadow-sm    ">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600  ">Editando</p>
              <p className="text-base font-semibold">{selectionLabel}</p>
            </div>
            {(selectionStart || selectionEnd) && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-sm text-zinc-500 underline-offset-2 hover:underline  "
              >
                Limpiar selección
              </button>
            )}
          </div>
          <p className="mb-4 text-xs text-zinc-500  ">
            Hacé clic en un día para editarlo solo, o en un día de inicio y otro
            de fin para aplicar el mismo cambio a todo ese rango — igual que la
            selección de estadía de los visitantes.
          </p>
          <div className="grid gap-4 grid-cols-1">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-zinc-600  ">
                Disponibilidad
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAvailableInput("available")}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    availableInput === "available"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800 "
                      : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Disponible
                </button>
                <button
                  type="button"
                  onClick={() => setAvailableInput("blocked")}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    availableInput === "blocked"
                      ? "border-red-400 bg-red-50 text-red-800 "
                      : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Bloquear
                </button>
              </div>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600  ">
                Precio por noche
              </span>
              <input
                type="number"
                min={0}
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder={
                  selectedProperty
                    ? String(selectedProperty.defaultPrice)
                    : "Precio por defecto"
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm    "
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600  ">
                Estadía mínima (noches)
              </span>
              <input
                type="number"
                min={1}
                value={minStayInput}
                onChange={(e) => setMinStayInput(e.target.value)}
                placeholder={
                  selectedProperty
                    ? String(selectedProperty.defaultMinStay)
                    : "Mínimo por defecto"
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm    "
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Dejá un campo vacío para usar el valor por defecto de la propiedad.
          </p>
          <button
            type="button"
            disabled={!selectionStart || !selectionEnd || saving}
            onClick={applyToSelection}
            className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Guardando…" : "Aplicar a la selección"}
          </button>
          {formMessage && (
            <p
              className={`mt-3 text-sm font-medium ${
                formMessage.type === "success"
                  ? "text-emerald-600 "
                  : "text-red-600 "
              }`}
            >
              {formMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
