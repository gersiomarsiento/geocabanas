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

import { convertFromUSD, formatCurrency } from "@/lib/currency";
import { useCurrency } from "../components/CurrencyProvider";

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDisplayDate({ year, month, day }: DateParts) {
  return `${day} ${MONTHS[month]} ${year}`;
}

function nightsBetween(start: DateParts, end: DateParts): number {
  return Math.round(
    (toDate(end).getTime() - toDate(start).getTime()) / 86_400_000,
  );
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
  property: {
    id: string;
    name: string;
    slug: string;
    currency: string;
  };
  days: DayInfo[];
}

interface CarouselImage {
  id: string;
  url: string;
}

export default function BookingCalendar() {
  const { currency, rates } = useCurrency();
  const today = startOfToday();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const [startDate, setStartDate] = useState<DateParts | null>(null);
  const [endDate, setEndDate] = useState<DateParts | null>(null);

  const router = useRouter();

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const emailTrimmed = guestEmail.trim();
  const isEmailFormatValid =
    emailTrimmed === "" || EMAIL_REGEX.test(emailTrimmed);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Property selector ---
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
        if (!res.ok) {
          throw new Error("No se pudieron cargar las propiedades");
        }

        return res.json() as Promise<PublicProperty[]>;
      })
      .then((data) => {
        setProperties(data);

        if (data.length > 0) {
          setSelectedSlug(data[0].slug);
        }
      })
      .catch((e) => {
        setPropertiesError(e.message);
      });
  }, []);

  // --- Availability + price ---
  const [days, setDays] = useState<Map<string, DayInfo> | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [rangeError, setRangeError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // --- Property images ---
  useEffect(() => {
    if (!selectedProperty) return;

    let ignore = false;

    setCarouselImages([]);

    fetch(`/api/properties/${selectedProperty.id}/images`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudieron cargar las fotos");
        }

        return res.json() as Promise<CarouselImage[]>;
      })
      .then((images) => {
        if (!ignore) setCarouselImages(images);
      })
      .catch(() => {
        // El carrusel simplemente no se muestra si fallan las imágenes.
      });

    return () => {
      ignore = true;
    };
  }, [selectedProperty]);

  // --- Availability ---
  useEffect(() => {
    if (!selectedSlug) return;

    let ignore = false;

    setIsLoading(true);
    setDays(null);
    setLoadError(null);

    fetch(
      `/api/booking/availability?property=${encodeURIComponent(selectedSlug)}`,
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo cargar la disponibilidad");
        }

        return res.json() as Promise<AvailabilityResponse>;
      })
      .then((data) => {
        if (ignore) return;

        const map = new Map<string, DayInfo>();

        for (const day of data.days) {
          map.set(day.date, day);
        }

        setDays(map);
      })
      .catch((e) => {
        if (!ignore) setLoadError(e.message);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedSlug]);

  // --- Moneda ---
  // Todos los precios que llegan desde la API se consideran USD.
  // La conversión es únicamente visual.
  function formatPrice(amount: number) {
    const convertedAmount = convertFromUSD(amount, currency, rates);

    return formatCurrency(convertedAmount, currency);
  }

  // --- Unavailable dates ---
  const unavailableDates = useMemo(() => {
    const set = new Set<string>();

    days?.forEach((info, date) => {
      if (!info.available) {
        set.add(date);
      }
    });

    return set;
  }, [days]);

  const calendarDays = buildCalendarDays(viewYear, viewMonth);

  const todayKey = toDateKey({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  });

  // --- Total ---
  const stayTotal = useMemo(() => {
    if (!startDate || !endDate || !days) {
      return null;
    }

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

    return {
      nights,
      total,
    };
  }, [startDate, endDate, days]);

  function getDayInfo(parts: DateParts): DayInfo {
    const key = toDateKey(parts);

    return (
      days?.get(key) ?? {
        date: key,
        available: false,
        price: null,
        minStay: null,
      }
    );
  }

  function isBooked(parts: DateParts) {
    return !getDayInfo(parts).available;
  }

  function goToPreviousMonth() {
    setHoveredDay(null);

    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    setHoveredDay(null);

    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayClick(day: number) {
    const clicked: DateParts = {
      year: viewYear,
      month: viewMonth,
      day,
    };

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
          `La estadía mínima es de ${requiredMinStay} ${
            requiredMinStay === 1 ? "noche" : "noches"
          }. Elegí una fecha de salida más lejana.`,
        );

        setStartDate(clicked);
        setEndDate(null);

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
          `La estadía mínima es de ${requiredMinStay} ${
            requiredMinStay === 1 ? "noche" : "noches"
          }. Elegí una fecha de salida más lejana.`,
        );

        setEndDate(null);

        return;
      }

      setEndDate(clicked);
    }
  }

  async function handleReserve() {
    if (!selectedProperty || !startDate || !endDate) {
      return;
    }

    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setSubmitError("Completá tu nombre, email y teléfono para continuar.");

      return;
    }

    if (!EMAIL_REGEX.test(guestEmail.trim())) {
      setSubmitError("Ingresá un email válido.");

      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

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
    const parts: DateParts = {
      year: viewYear,
      month: viewMonth,
      day,
    };

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

    return {
      isPast,
      isToday,
      isStart,
      isEnd,
      isInRange,
      booked,
      info,
    };
  }

  const selectionHint = !startDate
    ? "Seleccioná la fecha de entrada"
    : !endDate
      ? "Seleccioná la fecha de salida"
      : "Seleccioná otra fecha de entrada para modificar";

  const hasValidRange =
    startDate && endDate && toDateKey(startDate) !== toDateKey(endDate);

  if (propertiesError || loadError) {
    return (
      <div className="w-full max-w-lg md:max-w-360 rounded-xl border border-zinc-200 bg-background p-6 text-center text-sm text-zinc-500 shadow-sm">
        No se pudo cargar la disponibilidad en este momento.
      </div>
    );
  }

  return (
    <div className="booking-wrapper max-w-lg md:max-w-354 w-full space-y-4 justify-items-center md:grid md:grid-cols-2 md:gap-x-4">
      {/* Property selector */}
      <div className="property-details-wrapper w-full md:flex md:flex-col">
        {properties && properties.length > 1 && (
          <div className="flex flex-col items-center rounded-t-xl border border-b-0 border-zinc-200 bg-background shadow-sm">
            <label
              htmlFor="visitor-property-select"
              className="text-sm font-bold text-primary-foreground bg-primary rounded-t-xl w-full text-center content-center h-15"
            >
              Seleccioná la propiedad
            </label>

            <div className="bg-white p-3 md:p-6 w-full">
              <div className="relative w-full flex items-center gap-2">
                <label
                  htmlFor="visitor-property-select"
                  className="inline text-sm"
                >
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

                <div className="pointer-events-none absolute rotate-90 inset-y-0 right-0 flex items-center text-primary">
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
            className={`overflow-hidden border border-zinc-200 shadow-sm ${
              properties && properties.length > 1
                ? "border"
                : "border rounded-t-xl"
            }`}
          >
            {carouselImages.length > 0 ? (
              <PropertyCarousel images={carouselImages} />
            ) : (
              <div className="aspect-4/3 w-full animate-pulse bg-background" />
            )}
          </div>

          {selectedProperty && <PropertyDetails property={selectedProperty} />}
        </div>
      </div>

      {/* Calendar */}
      <div className="booking-calendar-wrapper max-w-lg md:max-w-full w-full flex flex-col rounded-t-xl">
        <div
          id="reservar-section"
          className="w-full rounded-t-xl bg-primary text-primary-foreground mb-0 h-15 flex flex-col justify-center p-3 md:p-6"
        >
          {rangeError ? (
            <p className="text-center text-sm font-medium text-red-200">
              {rangeError}
            </p>
          ) : (
            <p className="text-center font-bold text-sm text-primary-foreground">
              {selectionHint}
            </p>
          )}
        </div>

        <div className="w-full relative border border-zinc-200 bg-white p-3 md:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Mes anterior"
              className="rounded-md px-3 max-h-10 flex items-center text-primary-foreground transition-colors hover:bg-zinc-100"
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
              className="rounded-md px-3 max-h-10 flex items-center text-primary-foreground transition-colors hover:bg-zinc-100"
            >
              <CaretIcon />
            </button>
          </div>

          <div className="">
            {isLoading && <LoadingOverlay />}

            <div
              className="grid grid-cols-7 gap-1 text-center text-sm"
              onMouseLeave={() => setHoveredDay(null)}
            >
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

                const isHovered = hoveredDay === day;

                let dateLabel: string | null = null;
                if (isStart) {
                  dateLabel = "IN";
                } else if (isEnd) {
                  dateLabel = "OUT";
                } else if (isHovered && !isDisabled) {
                  dateLabel = !startDate || endDate ? "IN" : "OUT";
                }

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={isDisabled}
                    title={booked ? "Ocupado" : undefined}
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => setHoveredDay(day)}
                    className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md transition-colors ${
                      booked && isToday
                        ? "cursor-not-allowed font-extrabold bg-zinc-100 text-zinc-300 line-through"
                        : booked
                          ? "cursor-not-allowed bg-zinc-100 text-zinc-300 line-through"
                          : isPast
                            ? "cursor-not-allowed text-zinc-300"
                            : isSelected
                              ? "bg-accent-500 font-semibold text-accent-foreground"
                              : isInRange
                                ? "bg-accent-200 text-zinc-800"
                                : isToday
                                  ? "font-extrabold text-foreground hover:bg-accent-500 hover:text-white"
                                  : "text-zinc-700 hover:bg-accent-500 hover:text-white"
                    }`}
                  >
                    {dateLabel && (
                      <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground shadow-sm">
                        {dateLabel}
                      </span>
                    )}

                    <span>{day}</span>

                    {!isPast &&
                      !booked &&
                      !selectedProperty?.hideNightlyPrice &&
                      info.price != null && (
                        <span className="text-[10px] font-normal leading-none opacity-70">
                          {formatPrice(info.price)}
                        </span>
                      )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reservation summary */}
        <div className="h-full w-full min-h-34 content-center rounded-b-xl border border-zinc-200 bg-primary p-3 shadow-sm md:p-6">
          {hasValidRange && !rangeError && stayTotal ? (
            <>
              <p className="text-primary-foreground font-bold mb-2 text-center">
                Datos de tu reserva:
              </p>

              <p className="text-center text-sm font-bold text-primary-foreground">
                {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
              </p>

              <p className="mt-1 text-center text-sm text-primary-foreground">
                {stayTotal.nights} {stayTotal.nights === 1 ? "noche" : "noches"}{" "}
                ·{" "}
                <span className="text-[16px] font-bold">
                  {formatPrice(stayTotal.total)} total
                </span>
              </p>
            </>
          ) : (
            <p className="text-center text-sm text-primary-foreground">
              Seleccioná un rango de fechas válido para ver la información de tu
              reserva
            </p>
          )}
        </div>
      </div>

      {/* Guest details */}
      <div className="booking-details-wrapper max-w-lg md:max-w-full md:col-span-2 w-full h-fit rounded-xl border border-zinc-200 bg-white p-3 md:p-6 shadow-sm">
        <h3 className="mb-4">Completá tus datos para reservar</h3>

        <div className="grid gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              Nombre y apellido *
            </span>

            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              Email *
            </span>

            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className={`w-full rounded-md border px-3 py-1.5 text-sm ${
                isEmailFormatValid ? "border-zinc-300" : "border-red-400"
              }`}
            />

            {!isEmailFormatValid && (
              <span className="mt-1 block text-xs font-medium text-red-600">
                Ingresá un email con formato válido.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600">
              Teléfono *
            </span>

            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
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
            !isEmailFormatValid ||
            !guestPhone.trim() ||
            (startDate &&
              endDate &&
              nightsBetween(startDate, endDate) <
                (getDayInfo(startDate).minStay ?? 1))
          }
          onClick={handleReserve}
          className="mt-4 w-full md:w-fit rounded-md bg-foreground not-disabled:hover:bg-accent-500 px-4 py-2 text-sm font-semibold text-background transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Reservando…" : "Reservar"}
        </button>

        {submitError && (
          <p className="mt-3 text-sm font-medium text-red-600">{submitError}</p>
        )}
      </div>
    </div>
  );
}
