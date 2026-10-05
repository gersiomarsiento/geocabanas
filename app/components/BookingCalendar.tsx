"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

import {
  type DateParts,
  toDate,
  toDateKey,
  startOfToday,
  buildCalendarCells,
  rangeHasDateInSet,
} from "@/lib/calendar/dates";

import { convertFromUSD, formatCurrency } from "@/lib/currency";
import { useCurrency } from "../components/CurrencyProvider";

import PropertyCarousel from "./PropertyCarousel";
import PropertyDetails from "./PropertyDetails";
import LoadingOverlay from "./LoadingOverlay";
import { CaretIcon } from "./icons";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDisplayDate({ year, month, day }: DateParts, months: string[]) {
  return `${day} ${months[month]} ${year}`;
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
  const t = useTranslations("Booking");
  const tUnits = useTranslations("Units");
  const weekdays = t.raw("weekdays") as string[];
  const months = t.raw("months") as string[];
  const locale = useLocale();

  const { currency, rates } = useCurrency();
  const [today, setToday] = useState<Date | null>(null);
  const [viewYear, setViewYear] = useState<number | null>(null);
  const [viewMonth, setViewMonth] = useState<number | null>(null);

  useEffect(() => {
    const now = startOfToday();
    setToday(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }, []);

  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

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

  const [days, setDays] = useState<Map<string, DayInfo> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  function formatPrice(amount: number) {
    const convertedAmount = convertFromUSD(amount, currency, rates);
    return formatCurrency(convertedAmount, currency);
  }

  const unavailableDates = useMemo(() => {
    const set = new Set<string>();
    days?.forEach((info, date) => {
      if (!info.available) {
        set.add(date);
      }
    });
    return set;
  }, [days]);

  const calendarCells =
    viewYear !== null && viewMonth !== null
      ? buildCalendarCells(viewYear, viewMonth)
      : [];

  const todayKey = today
    ? toDateKey({
        year: today.getFullYear(),
        month: today.getMonth(),
        day: today.getDate(),
      })
    : "";

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

    return { nights, total };
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
    if (viewMonth === null || viewYear === null) return;
    setHoveredDay(null);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => (y ?? 0) - 1);
    } else {
      setViewMonth((m) => (m ?? 0) - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === null || viewYear === null) return;
    setHoveredDay(null);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => (y ?? 0) + 1);
    } else {
      setViewMonth((m) => (m ?? 0) + 1);
    }
  }

  function handleDayClick(clicked: DateParts) {
    if (!today) return;
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
        setRangeError(t("rangoConFechasOcupadas"));
        setStartDate(clicked);
        setEndDate(null);
        return;
      }

      const nights = nightsBetween(clicked, startDate);
      const requiredMinStay = getDayInfo(clicked).minStay ?? 1;

      if (nights < requiredMinStay) {
        setRangeError(t("estadiaMinima", { count: requiredMinStay }));
        setStartDate(clicked);
        setEndDate(null);
        return;
      }

      setEndDate(startDate);
      setStartDate(clicked);
    } else {
      if (rangeHasDateInSet(startDate, clicked, unavailableDates)) {
        setRangeError(t("rangoConFechasOcupadas"));
        setStartDate(clicked);
        setEndDate(null);
        return;
      }

      const nights = nightsBetween(startDate, clicked);
      const requiredMinStay = getDayInfo(startDate).minStay ?? 1;

      if (nights < requiredMinStay) {
        setRangeError(t("estadiaMinima", { count: requiredMinStay }));
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
      setSubmitError(t("completaDatosParaContinuar"));
      return;
    }

    if (!EMAIL_REGEX.test(guestEmail.trim())) {
      setSubmitError(t("emailValido"));
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
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setSubmitError(data.error ?? t("noSePudoCompletarReserva"));
        return;
      }

      if (data.whatsappUrl) {
        try {
          sessionStorage.setItem(`wa:${data.reservationId}`, data.whatsappUrl);
        } catch {
          // storage unavailable (private mode): the email still has the button
        }
      }

      router.push(
        `/reserva-confirmada?id=${data.reservationId}&mode=${data.bookingMode}`,
      );
    } catch {
      setSubmitError(t("errorGenerico"));
    } finally {
      setSubmitting(false);
    }
  }

  function getDayState(parts: DateParts) {
    if (!today) {
      return {
        isPast: false,
        isToday: false,
        isStart: false,
        isEnd: false,
        isInRange: false,
        booked: false,
        info: { date: "", available: false, price: null, minStay: null },
      };
    }
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
    ? t("seleccionaEntrada")
    : !endDate
      ? t("seleccionaSalida")
      : t("seleccionaOtraEntrada");

  const hasValidRange =
    startDate && endDate && toDateKey(startDate) !== toDateKey(endDate);

  if (propertiesError || loadError) {
    return (
      <div className="w-full max-w-lg md:max-w-360 rounded-xl border border-zinc-200 bg-background p-6 text-center text-sm text-zinc-500 shadow-sm">
        {t("noSePudoCargarDisponibilidad")}
      </div>
    );
  }
  const belowMinStay =
    !!startDate &&
    !!endDate &&
    nightsBetween(startDate, endDate) < (getDayInfo(startDate).minStay ?? 1);

  if (!today || viewYear === null || viewMonth === null) {
    return <LoadingOverlay className="" />;
  }

  return (
    <div className="booking-wrapper mx-auto grid w-full max-w-lg gap-y-4 md:max-w-354 md:grid-cols-3 md:items-stretch md:gap-x-4">
      {/* ───────── LEFT: selector + gallery + details ───────── */}
      <div className="property-details-wrapper flex w-full flex-col md:col-span-3 lg:col-span-2">
        {properties && properties.length > 1 && (
          <div className="flex flex-col items-center rounded-t-xl bg-background shadow-sm">
            <label
              htmlFor="visitor-property-select"
              className="h-15 w-full content-center rounded-t-xl bg-primary text-center text-sm font-bold text-primary-foreground"
            >
              {t("seleccionaPropiedad")}
            </label>

            <div className="w-full bg-white p-3 md:p-6">
              <div className="relative flex w-full items-center gap-2">
                <label
                  htmlFor="visitor-property-select"
                  className="inline text-sm"
                >
                  {t("hospedaje")}
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

                <div className="pointer-events-none absolute inset-y-0 right-0 flex rotate-90 items-center text-primary">
                  <CaretIcon />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="property-content-wrapper relative flex flex-col md:flex-1">
          {isLoading && <LoadingOverlay className="bg-white!" />}

          {/* Gallery: 4/3 on mobile; on desktop it absorbs whatever height
              the right column needs, so both columns end flush. */}
          <div
            className={`relative aspect-4/3 overflow-hidden bg-white md:aspect-auto md:min-h-96 md:flex-1 ${
              properties && properties.length > 1 ? "" : "rounded-t-xl"
            }`}
          >
            {carouselImages.length > 0 ? (
              <PropertyCarousel
                images={carouselImages}
                alt={selectedProperty?.name ?? ""}
              />
            ) : (
              <div className="absolute inset-0 animate-pulse bg-secondary-50" />
            )}
          </div>

          {selectedProperty && <PropertyDetails property={selectedProperty} />}
        </div>
      </div>

      {/* ───────── RIGHT: calendar + summary + guest form, one card ───────── */}
      <div className="booking-calendar-wrapper flex w-full max-w-lg flex-col md:max-w-full">
        {/* Hint / error bar */}
        <div
          id="reservar-section"
          className="flex h-15 w-full flex-col justify-center rounded-t-xl bg-primary p-3 text-primary-foreground md:p-6"
        >
          {rangeError ? (
            <p className="text-center text-sm font-medium text-red-200">
              {rangeError}
            </p>
          ) : (
            <p className="text-center text-sm font-bold text-primary-foreground">
              {selectionHint}
            </p>
          )}
        </div>

        {/* Calendar */}
        <div className="relative w-full border border-zinc-200 bg-white px-2 py-3 shadow-sm md:py-6">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label={t("mesAnterior")}
              className="flex max-h-10 items-center rounded-md px-3 text-primary-foreground transition-colors hover:bg-accent"
            >
              <CaretIcon className="rotate-180" />
            </button>

            <p className="text-lg text-center font-semibold">
              {months[viewMonth]} {viewYear}
            </p>

            <button
              type="button"
              onClick={goToNextMonth}
              aria-label={t("mesSiguiente")}
              className="flex max-h-10 items-center rounded-md px-3 text-primary-foreground transition-colors hover:bg-accent"
            >
              <CaretIcon />
            </button>
          </div>

          <div>
            {isLoading && <LoadingOverlay className="bg-white!" />}

            <div
              className="grid grid-cols-7 gap-1 text-center text-sm"
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") setHoveredDay(null);
              }}
            >
              {weekdays.map((weekday) => (
                <div key={weekday} className="py-2 font-medium text-zinc-500">
                  {weekday}
                </div>
              ))}

              {calendarCells.map((cell) => {
                const key = toDateKey(cell);
                const {
                  isPast,
                  isToday,
                  isStart,
                  isEnd,
                  isInRange,
                  booked,
                  info,
                } = getDayState(cell);
                const isSelected = isStart || isEnd;
                const isDisabled = isPast || booked;
                const isHovered = hoveredDay === key;

                let dateLabel: string | null = null;
                if (isStart) dateLabel = "IN";
                else if (isEnd) dateLabel = "OUT";
                else if (isHovered && !isDisabled)
                  dateLabel = !startDate || endDate ? "IN" : "OUT";

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isDisabled}
                    title={booked ? t("ocupado") : undefined}
                    onClick={() => handleDayClick(cell)}
                    onPointerEnter={(e) => {
                      if (e.pointerType === "mouse") setHoveredDay(key);
                    }}
                    className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md transition-colors ${
                      booked && isToday
                        ? "cursor-not-allowed bg-zinc-100 font-extrabold text-zinc-300 line-through"
                        : booked && isPast
                          ? "cursor-not-allowed bg-white text-zinc-300 line-through"
                          : booked
                            ? "cursor-not-allowed bg-zinc-100 text-zinc-300 line-through"
                            : isPast
                              ? "cursor-not-allowed bg-white! text-zinc-300"
                              : isSelected
                                ? "bg-accent-500 font-semibold text-accent-foreground"
                                : isInRange
                                  ? "bg-accent-200 text-zinc-800"
                                  : isToday
                                    ? "font-extrabold text-foreground hover:bg-accent-500 hover:text-white"
                                    : "text-zinc-700 hover:bg-accent-500 hover:text-white"
                    }${
                      cell.outside && !isSelected && !isInRange
                        ? " opacity-50"
                        : ""
                    }`}
                  >
                    {dateLabel && (
                      <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground shadow-sm">
                        {dateLabel}
                      </span>
                    )}

                    <span>{cell.day}</span>
                    {!isPast &&
                      !booked &&
                      !selectedProperty?.hideNightlyPrice &&
                      info.price != null && (
                        <span className="text-[9px] font-normal leading-none opacity-70 lg:text-[12px]">
                          {formatPrice(info.price)}
                        </span>
                      )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Booking summary bar */}
        <div className="flex min-h-24 md:min-h-31 w-full flex-col justify-center border-x border-zinc-200 bg-primary p-3 shadow-sm md:p-6">
          {hasValidRange && !rangeError && stayTotal ? (
            <>
              <p className="mb-1 text-center font-bold text-primary-foreground">
                {t("datosDeTuReserva")}
              </p>
              <p className="text-center text-sm font-bold text-primary-foreground">
                {formatDisplayDate(startDate, months)} →{" "}
                {formatDisplayDate(endDate, months)}
              </p>
              <p className="mt-1 text-center text-sm text-primary-foreground">
                {tUnits("noches", { count: stayTotal.nights })} ·{" "}
                <span className="text-[16px] font-bold">
                  {formatPrice(stayTotal.total)} {t("total")}
                </span>
              </p>
            </>
          ) : (
            <p className="text-center text-sm text-primary-foreground">
              {t("seleccionaRangoValido")}
            </p>
          )}
        </div>

        {/* Guest details: flex-1 so the card's bottom edge matches the left column */}
        <div className="booking-details-wrapper w-full rounded-b-xl border border-zinc-200 bg-white p-3 shadow-sm md:flex-1 md:p-6">
          <h3 className="mb-4">{t("completaTusDatos")}</h3>

          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                {t("nombreYApellido")}
              </span>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </label>

            <div className="grid gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                  {t("email")}
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
                    {t("emailInvalido")}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                  {t("telefono")}
                </span>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </label>
            </div>
          </div>

          <p className="mt-4 text-sm">{t("condicionesReserva")}</p>

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
              belowMinStay
            }
            onClick={handleReserve}
            className="mt-4 w-full rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition not-disabled:hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? t("reservando") : t("reservar")}
          </button>

          {submitError && (
            <p className="mt-3 text-sm font-medium text-red-600">
              {submitError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
