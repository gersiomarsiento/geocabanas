"use client";

// app/components/AvailabilitySearch.tsx

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { convertFromUSD, formatCurrency } from "@/lib/currency";
import { useCurrency } from "./CurrencyProvider";

interface PropertyResult {
  id: string;
  name: string;
  slug: string;
  maxGuests: number;
  bedrooms: number;
  totalPrice: number;
}

interface ComboResult {
  properties: PropertyResult[];
  totalPrice: number;
  totalMaxGuests: number;
  totalBedrooms: number;
}

interface SearchResponse {
  currency: string;
  bedroomsRelaxed: boolean;
  singles: PropertyResult[];
  combos: ComboResult[];
}

type Recommended =
  | { type: "single"; property: PropertyResult }
  | { type: "combo"; combo: ComboResult }
  | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDisplayDate(dateISO: string) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-UY", { day: "numeric", month: "short" });
}

function nightsBetween(start: string, end: string) {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startTime = new Date(sy, sm - 1, sd).getTime();
  const endTime = new Date(ey, em - 1, ed).getTime();
  return Math.round((endTime - startTime) / 86_400_000);
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4 shrink-0"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-4 w-4 shrink-0"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function AvailabilitySearch() {
  const t = useTranslations("AvailabilitySearch");
  const tBooking = useTranslations("Booking");
  const tUnits = useTranslations("Units");
  const { currency, rates } = useCurrency();
  const locale = useLocale();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(4);
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [needsChildren, setNeedsChildren] = useState(false);
  const [needsPets, setNeedsPets] = useState(false);

  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [recommended, setRecommended] = useState<Recommended>(null);
  const [bedroomsRelaxed, setBedroomsRelaxed] = useState(false);
  const [searchedDates, setSearchedDates] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [reserved, setReserved] = useState(false);

  function formatPrice(amount: number) {
    return formatCurrency(convertFromUSD(amount, currency, rates), currency);
  }

  async function handleSearch() {
    if (!startDate || !endDate || guests < 1) {
      setSearchError(t("completaFechasYPersonas"));
      return;
    }
    if (startDate >= endDate) {
      setSearchError(t("fechaSalidaInvalida"));
      return;
    }

    setSearching(true);
    setSearchError(null);
    setReserved(false);
    setReserveError(null);

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        guests: String(guests),
      });
      if (bedrooms !== "") params.set("bedrooms", String(bedrooms));
      if (needsChildren) params.set("children", "true");
      if (needsPets) params.set("pets", "true");

      const res = await fetch(`/api/booking/search?${params.toString()}`);
      if (!res.ok) throw new Error(t("noSePudoBuscar"));
      const data = (await res.json()) as SearchResponse;

      setBedroomsRelaxed(data.bedroomsRelaxed);
      setSearched(true);
      setSearchedDates({ start: startDate, end: endDate });

      if (data.singles.length > 0) {
        setRecommended({ type: "single", property: data.singles[0] });
      } else if (data.combos.length > 0) {
        setRecommended({ type: "combo", combo: data.combos[0] });
      } else {
        setRecommended(null);
      }
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : t("noSePudoBuscar"));
    } finally {
      setSearching(false);
    }
  }

  async function handleReserve() {
    if (!recommended || !searchedDates) return;
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setReserveError(tBooking("completaDatosParaContinuar"));
      return;
    }
    if (!EMAIL_REGEX.test(guestEmail.trim())) {
      setReserveError(tBooking("emailValido"));
      return;
    }

    setReserving(true);
    setReserveError(null);

    try {
      const endpoint =
        recommended.type === "single"
          ? "/api/reservations"
          : "/api/reservations/group";

      const body =
        recommended.type === "single"
          ? {
              propertyId: recommended.property.id,
              startDate: searchedDates.start,
              endDate: searchedDates.end,
              guestName: guestName.trim(),
              guestEmail: guestEmail.trim(),
              guestPhone: guestPhone.trim(),
              locale,
            }
          : {
              legs: recommended.combo.properties.map((p) => ({
                propertyId: p.id,
                startDate: searchedDates.start,
                endDate: searchedDates.end,
              })),
              guestName: guestName.trim(),
              guestEmail: guestEmail.trim(),
              guestPhone: guestPhone.trim(),
              locale,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? tBooking("noSePudoCompletarReserva"));
      }

      setReserved(true);
    } catch (e) {
      setReserveError(
        e instanceof Error ? e.message : tBooking("noSePudoCompletarReserva"),
      );
    } finally {
      setReserving(false);
    }
  }

  const nights =
    searchedDates != null
      ? nightsBetween(searchedDates.start, searchedDates.end)
      : null;

  return (
    <div className="w-full max-w-lg md:max-w-354 mt-4 flex flex-col md:flex-row gap-4">
      <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm w-full">
        <div className="bg-primary px-4 py-3 md:px-6 md:py-4 text-primary-foreground">
          <h3 className="font-bold">{t("titulo")}</h3>
          <p className="mt-0.5 text-sm text-primary-foreground/80">
            {t("subtitulo")}
          </p>
        </div>

        <div className="bg-white p-3 md:p-6 h-full">
          <div className="grid gap-3 grid-cols-2 items-end">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                {t("entrada")}
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                {t("salida")}
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                {t("personas")}
              </span>
              <input
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-600">
                {t("habitacionesOpcional")}
              </span>
              <input
                type="number"
                min={1}
                value={bedrooms}
                onChange={(e) =>
                  setBedrooms(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={needsChildren}
                onChange={(e) => setNeedsChildren(e.target.checked)}
              />
              {t("viajamosConNinos")}
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={needsPets}
                onChange={(e) => setNeedsPets(e.target.checked)}
              />
              {t("viajamosConMascota")}
            </label>
          </div>

          <button
            type="button"
            disabled={searching}
            onClick={handleSearch}
            className="mt-4 w-full md:w-fit rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {searching ? t("buscando") : t("buscarDisponibilidad")}
          </button>

          {searchError && (
            <p className="mt-3 text-sm font-medium text-red-600">
              {searchError}
            </p>
          )}
        </div>
      </div>

      {searched ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm w-full">
          {recommended === null ? (
            <div className="bg-white p-3 md:p-6">
              <p className="text-sm text-zinc-600">{t("sinResultados")}</p>
            </div>
          ) : (
            <>
              <div className="bg-primary px-4 py-3 md:px-6 md:py-4 text-primary-foreground">
                <h3 className="font-bold">
                  {recommended.type === "single"
                    ? recommended.property.name
                    : t("cabanasParaGrupo", {
                        count: recommended.combo.properties.length,
                      })}
                </h3>
                <p className="mt-0.5 text-sm text-primary-foreground/80">
                  {recommended.type === "combo"
                    ? t("combinacionRecomendada")
                    : t("alcanzaConUnaCabana")}
                </p>
              </div>

              <div className="bg-white p-3 md:p-6">
                {bedroomsRelaxed && (
                  <p className="mb-4 rounded-md bg-primary-50 px-3 py-2 text-sm text-primary">
                    {t("habitacionesRelajadas")}
                  </p>
                )}

                {searchedDates && nights !== null && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-zinc-600">
                    <CalendarIcon />
                    <span>
                      {formatDisplayDate(searchedDates.start)} →{" "}
                      {formatDisplayDate(searchedDates.end)} ·{" "}
                      {tUnits("noches", { count: nights })}
                    </span>
                  </div>
                )}

                {recommended.type === "single" ? (
                  <div className="flex items-center gap-2 rounded-lg bg-secondary-50 px-3 py-2 text-sm text-zinc-700">
                    <CheckIcon />
                    {t("hastaPersonas", {
                      count: recommended.property.maxGuests,
                    })}{" "}
                    ·{" "}
                    {tUnits("habitaciones", {
                      count: recommended.property.bedrooms,
                    })}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {recommended.combo.properties.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-secondary-50 px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2 font-medium text-primary">
                          <CheckIcon />
                          {p.name}
                        </span>
                        <span className="text-zinc-600">
                          {formatPrice(p.totalPrice)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex items-baseline justify-between border-t border-zinc-200 pt-4">
                  <span className="text-sm text-zinc-600">
                    {t("total")}
                    {recommended.type === "combo"
                      ? ` · ${t("reservasCount", {
                          count: recommended.combo.properties.length,
                        })}`
                      : ""}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(
                      recommended.type === "single"
                        ? recommended.property.totalPrice
                        : recommended.combo.totalPrice,
                    )}
                  </span>
                </div>

                {reserved ? (
                  <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                    {t("reservaExitosa", {
                      count:
                        recommended.type === "combo"
                          ? recommended.combo.properties.length
                          : 1,
                    })}
                  </p>
                ) : (
                  <div className="mt-4 border-t border-zinc-200 pt-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <input
                        type="text"
                        placeholder={t("placeholderNombre")}
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
                      />
                      <input
                        type="email"
                        placeholder={t("placeholderEmail")}
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
                      />
                      <input
                        type="tel"
                        placeholder={t("placeholderTelefono")}
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={reserving}
                      onClick={handleReserve}
                      className="mt-3 w-full md:w-fit rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {reserving
                        ? tBooking("reservando")
                        : recommended.type === "combo"
                          ? t("reservarTodas")
                          : tBooking("reservar")}
                    </button>

                    {reserveError && (
                      <p className="mt-3 text-sm font-medium text-red-600">
                        {reserveError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm w-full">
          <div className="bg-primary px-4 py-3 md:px-6 md:py-4 text-primary-foreground min-h-23.5 md:min-h-21.5">
            <h3 className="font-bold">{t("resultados")}</h3>
          </div>
          <div className="bg-white p-3 md:p-6 min-h-69 h-auto content-center text-center">
            {t("realizaUnaBusqueda")}
          </div>
        </div>
      )}
    </div>
  );
}
