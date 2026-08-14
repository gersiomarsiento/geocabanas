"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type DateParts,
  toDate,
  toDateKey,
  startOfToday,
  buildCalendarDays,
  rangeHasDateInSet,
} from "@/lib/calendar/dates";
import PropertyCarousel from "./PropertyCarousel";
import PropertyDetails from "./PropertyDetails";
import LoadingOverlay from "./LoadingOverlay";
import { CaretIcon } from "./icons";

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

function nightsBetween(start: DateParts, end: DateParts): number {
  return Math.round(
    (toDate(end).getTime() - toDate(start).getTime()) / 86_400_000,
  );
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

interface PublicProperty {
  id: string;
  name: string;
  slug: string;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  maxGuests: number | null;
  hideNightlyPrice: boolean;
  childrenAllowed: boolean | null;
  petsAllowed: boolean | null;
  amenities: string[];
}

interface DayInfo {
  date: string;
  available: boolean;
  price: number | null;
  minStay: number | null;
}

interface AvailabilityResponse {
  property: { id: string; name: string; slug: string; currency: string };
  days: DayInfo[];
}

interface CarouselImage {
  id: string;
  url: string;
}

export default function BookingCalendar() {
  const today = startOfToday();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [startDate, setStartDate] = useState<DateParts | null>(null);
  const [endDate, setEndDate] = useState<DateParts | null>(null);

  const router = useRouter();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Property selector (hidden unless there's more than one) ---
  const [properties, setProperties] = useState<PublicProperty[] | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);

  const selectedProperty = useMemo(
    () => properties?.find((p) => p.slug === selectedSlug) ?? null,
    [properties, selectedSlug],
  );

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las propiedades");
        return res.json() as Promise<PublicProperty[]>;
      })
      .then((data) => {
        setProperties(data);
        if (data.length > 0) setSelectedSlug(data[0].slug);
      })
      .catch((e) => setPropertiesError(e.message));
  }, []);

  // --- Availability + price for the selected property ---
  const [days, setDays] = useState<Map<string, DayInfo> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedProperty) return;
    setCarouselImages([]);

    fetch(`/api/properties/${selectedProperty.id}/images`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las fotos");
        return res.json() as Promise<CarouselImage[]>;
      })
      .then(setCarouselImages)
      .catch(() => {
        // Fine to fail quietly here — PropertyCarousel already renders
        // nothing when the images array is empty, so this degrades to
        // "no carousel shown" rather than a visible error for something
        // non-essential to actually booking.
      });
  }, [selectedProperty]);

  useEffect(() => {
    if (!selectedSlug) return;

    setIsLoading(true);
    setDays(null);
    setLoadError(null);

    fetch(
      `/api/booking/availability?property=${encodeURIComponent(selectedSlug)}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la disponibilidad");
        return res.json() as Promise<AvailabilityResponse>;
      })
      .then((data) => {
        const map = new Map<string, DayInfo>();
        for (const day of data.days) map.set(day.date, day);
        setDays(map);
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedSlug]);

  // Derived Set of unavailable dates, so the existing rangeHasDateInSet
  // helper (built for a plain Set<string>) keeps working unchanged.
  const unavailableDates = useMemo(() => {
    const set = new Set<string>();
    days?.forEach((info, date) => {
      if (!info.available) set.add(date);
    });
    return set;
  }, [days]);

  const calendarDays = buildCalendarDays(viewYear, viewMonth);
  const todayKey = toDateKey({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  });

  const stayTotal = useMemo(() => {
    if (!startDate || !endDate || !days) return null;
    let total = 0;
    const cur = toDate(startDate);
    const endTime = toDate(endDate).getTime();
    while (cur.getTime() < endTime) {
      const key = toDateKey({
        year: cur.getFullYear(),
        month: cur.getMonth(),
        day: cur.getDate(),
      });
      total += days.get(key)?.price ?? 0;
      cur.setDate(cur.getDate() + 1);
    }
    const nights = Math.round(
      (toDate(endDate).getTime() - toDate(startDate).getTime()) / 86_400_000,
    );
    return { nights, total };
  }, [startDate, endDate, days]);

  function getDayInfo(parts: DateParts): DayInfo {
    const key = toDateKey(parts);
    return (
      days?.get(key) ?? {
        date: key,
        available: true,
        price: null,
        minStay: null,
      }
    );
  }

  function isBooked(parts: DateParts) {
    return !getDayInfo(parts).available;
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

  function handleDayClick(day: number) {
    const clicked: DateParts = { year: viewYear, month: viewMonth, day };
    const clickedTime = toDate(clicked).getTime();

    if (clickedTime < today.getTime() || isBooked(clicked)) {
      return;
    }

    setRangeError(null);

    if (startDate && endDate) {
      setStartDate(clicked);
      setEndDate(null);
      return;
    }

    if (!startDate) {
      setStartDate(clicked);
      return;
    }

    const startTime = toDate(startDate).getTime();
    if (clickedTime < startTime) {
      if (rangeHasDateInSet(clicked, startDate, unavailableDates)) {
        setRangeError("Ese rango incluye fechas ocupadas. Elegí otra estadía.");
        setStartDate(clicked);
        setEndDate(null);
        return;
      }

      const nights = nightsBetween(clicked, startDate);
      const requiredMinStay = getDayInfo(clicked).minStay ?? 1;
      if (nights < requiredMinStay) {
        setRangeError(
          `La estadía mínima es de ${requiredMinStay} ${requiredMinStay === 1 ? "noche" : "noches"}. Elegí una fecha de salida más lejana.`,
        );
        setStartDate(clicked);
        setEndDate(null); // stays null on purpose — next click extends from here, doesn't reset again
        return;
      }

      setEndDate(startDate);
      setStartDate(clicked);
    } else {
      if (rangeHasDateInSet(startDate, clicked, unavailableDates)) {
        setRangeError("Ese rango incluye fechas ocupadas. Elegí otra estadía.");
        setStartDate(clicked);
        setEndDate(null);
        return;
      }

      const nights = nightsBetween(startDate, clicked);
      const requiredMinStay = getDayInfo(startDate).minStay ?? 1;
      if (nights < requiredMinStay) {
        setRangeError(
          `La estadía mínima es de ${requiredMinStay} ${requiredMinStay === 1 ? "noche" : "noches"}. Elegí una fecha de salida más lejana.`,
        );
        // Deliberately NOT resetting startDate here — the visitor's next
        // click just needs to be further out, without having to re-pick
        // their check-in date.
        setEndDate(null);
        return;
      }

      setEndDate(clicked);
    }
  }

  async function handleReserve() {
    if (!selectedProperty || !startDate || !endDate) return;
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setSubmitError("Completá tu nombre, email y teléfono para continuar.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          startDate: toDateKey(startDate),
          endDate: toDateKey(endDate),
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        // Someone else may have booked these dates seconds ago (409), or
        // the server-side re-check caught something the client missed.
        setSubmitError(data.error ?? "No se pudo completar la reserva.");
        return;
      }

      router.push(`/reserva-confirmada?id=${data.reservationId}`);
    } catch {
      setSubmitError("Ocurrió un error. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function getDayState(day: number) {
    const parts: DateParts = { year: viewYear, month: viewMonth, day };
    const key = toDateKey(parts);
    const time = toDate(parts).getTime();
    const isPast = time < today.getTime();
    const isToday = key === todayKey;
    const info = getDayInfo(parts);
    const booked = !info.available;

    let isStart = false;
    let isEnd = false;
    let isInRange = false;

    if (startDate) {
      const startTime = toDate(startDate).getTime();
      isStart = key === toDateKey(startDate);

      if (endDate) {
        const endTime = toDate(endDate).getTime();
        isEnd = key === toDateKey(endDate);
        isInRange = time > startTime && time < endTime;
      }
    }

    return { isPast, isToday, isStart, isEnd, isInRange, booked, info };
  }

  const selectionHint = !startDate
    ? "Seleccioná la fecha de entrada"
    : !endDate
      ? "Seleccioná la fecha de salida"
      : "Seleccioná otra fecha de entrada para modificar";

  const money = currencyFormatter(selectedProperty?.currency ?? "UYU");
  {console.log("stayTotal:", stayTotal, "hideNightlyPrice:", selectedProperty?.hideNightlyPrice)}
  const hasValidRange =
    startDate && endDate && toDateKey(startDate) !== toDateKey(endDate);

  if (propertiesError || loadError) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 shadow-sm">
        No se pudo cargar la disponibilidad en este momento.
      </div>
    );
  }

  return (
    <div className="booking-wrapper w-full space-y-4 justify-items-center md:grid md:grid-cols-2 md:gap-x-4">
      {/* Property selector */}
      <div className="property-details-wrapper max-w-lg md:max-w-full w-full md:flex md:flex-col">
        {properties && properties.length > 1 && (
          <div className="flex flex-col items-center rounded-t-xl border border-b-0 border-zinc-200 bg-white shadow-sm">
            <label
              htmlFor="visitor-property-select"
              className="text-sm font-bold text-white bg-black rounded-t-xl w-full text-center content-center h-15"
            >
              Seleccioná la propiedad
            </label>

            <div className="bg-white p-3 md:p-6 w-full">
              <div className="relative w-full flex items-center gap-2">
                <label htmlFor="visitor-property-select" className="inline text-sm">
                  Hospedaje:
                </label>
                <select
                  id="visitor-property-select"
                  name="visitor-property-select"
                  value={selectedSlug ?? ""}
                  onChange={(e) => {
                    setSelectedSlug(e.target.value);
                    setStartDate(null);
                    setEndDate(null);
                    setRangeError(null);
                  }}
                  className="inline w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 pr-10 text-sm font-medium text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute rotate-90 inset-y-0 right-0 flex items-center text-black">
                  <CaretIcon />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property content */}
        <div className="property-content-wrapper relative md:grid md:h-full">
          {isLoading && <LoadingOverlay />}
          <div
            className={`overflow-hidden border border-zinc-200 shadow-sm  ${
              properties && properties.length > 1
                ? "border"
                : "border rounded-t-xl"
            }`}
          >
            {carouselImages.length > 0 ? (
              <PropertyCarousel images={carouselImages} />
            ) : (
              <div className="aspect-4/3 w-full animate-pulse bg-white " />
            )}
          </div>

          {selectedProperty && <PropertyDetails property={selectedProperty} />}
        </div>
      </div>
      <div className="booking-calendar-wrapper max-w-lg md:max-w-full w-full flex flex-col rounded-t-xl">
        <div
          id="reservar-section"
          className="w-full rounded-t-xl bg-black text-white mb-0 h-15 flex flex-col justify-center p-3 md:p-6"
        >
          {rangeError ? (
            <p className="text-center text-sm font-medium text-red-400 ">
              {rangeError}
            </p>
          ) : (
            <p className="text-center font-bold text-sm text-white">
              {selectionHint}
            </p>
          )}
        </div>
        <div className="w-full border border-zinc-200 bg-white p-3 md:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Mes anterior"
              className="rounded-md px-3 max-h-10 flex items-center text-white transition-colors hover:bg-zinc-100 "
            >
              <CaretIcon className="rotate-180" />
            </button>
            <p className="text-lg font-semibold">
              {MONTHS[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Mes siguiente"
              className="rounded-md px-3 max-h-10 flex items-center text-white transition-colors hover:bg-zinc-100 "
            >
              <CaretIcon />
            </button>
          </div>

          <div className="relative">
            {!days && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                <p className="text-center text-sm text-zinc-500">
                  Cargando disponibilidad…
                </p>
              </div>
            )}

            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="py-2 font-medium text-zinc-500">
                  {weekday}
                </div>
              ))}

              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={index} aria-hidden />;
                }

                const {
                  isPast,
                  isToday,
                  isStart,
                  isEnd,
                  isInRange,
                  booked,
                  info,
                } = getDayState(day);

                const isSelected = isStart || isEnd;
                const isDisabled = isPast || booked;

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={isDisabled}
                    title={booked ? "Ocupado" : undefined}
                    onClick={() => handleDayClick(day)}
                    className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md transition-colors ${
                      booked && isToday
                        ? "cursor-not-allowed font-extrabold bg-zinc-100 text-zinc-300 line-through"
                        : booked
                          ? "cursor-not-allowed bg-zinc-100 text-zinc-300 line-through"
                          : isPast
                            ? "cursor-not-allowed text-zinc-300"
                            : isSelected
                              ? "bg-green-600 font-semibold text-background"
                              : isInRange
                                ? "bg-green-200 text-zinc-800"
                                : isToday
                                  ? "font-extrabold text-foreground hover:bg-green-100"
                                  : "text-zinc-700 hover:bg-green-100"
                    }`}
                  >
                    <span>{day}</span>

                    {!isPast &&
                      !booked &&
                      !selectedProperty?.hideNightlyPrice &&
                      info.price != null && (
                        <span className="text-[10px] font-normal leading-none opacity-70">
                          {money.format(info.price)}
                        </span>
                      )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="h-full w-full min-h-34 content-center rounded-b-xl border border-zinc-200 bg-black p-3 shadow-sm md:p-6">
          {hasValidRange && !rangeError && stayTotal ? (
            <>
              <p className="text-white font-bold mb-2 text-center">
                Datos de tu reserva:
              </p>
              <p className="text-center text-sm font-bold text-white">
                {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
              </p>

              
                <p className="mt-1 text-center text-sm text-white">
                  {stayTotal.nights}{" "}
                  {stayTotal.nights === 1 ? "noche" : "noches"} ·{" "}
                  <span className="text-[16px] font-bold">
                    {money.format(stayTotal.total)} total
                  </span>
                </p>
              
            </>
          ) : (
            <p className="text-center text-sm text-white">
              Seleccioná un rango de fechas válido para ver la información de tu
              reserva
            </p>
          )}
        </div>
      </div>

      <div className="booking-details-wrapper max-w-lg md:max-w-full md:col-span-2 w-full h-fit rounded-xl border border-zinc-200 bg-white p-3 md:p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">
          Completá tus datos para reservar
        </h3>

        <div className="grid gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              Nombre
            </span>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm "
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              Email
            </span>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm "
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              Teléfono
            </span>
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm "
            />
          </label>
        </div>
        <p className="mt-4 text-sm">
          Tras enviar el formulario, la reserva quedará pendiente de
          confirmación durante 24 horas. Para confirmarla, deberás hacer un
          depósito por el 50% del total, de lo contrario la misma se cancelará.
          Te enviaremos un correo electrónico con los pasos a seguir.
        </p>

        <button
          type="button"
          disabled={
            submitting ||
            isLoading ||
            !startDate ||
            !endDate ||
            !!rangeError ||
            !guestName.trim() ||
            !guestEmail.trim() ||
            !guestPhone.trim() ||
            (startDate &&
              endDate &&
              nightsBetween(startDate, endDate) <
                (getDayInfo(startDate).minStay ?? 1))
          }
          onClick={handleReserve}
          className="mt-4 w-full rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Reservando…" : "Reservar"}
        </button>

        {submitError && (
          <p className="mt-3 text-sm font-medium text-red-600 ">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}
