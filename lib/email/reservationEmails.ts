// lib/email/reservationEmails.ts

import { resend, FROM_ADDRESS, ADMIN_EMAIL } from "./resend";
import { getContactSettings } from "@/lib/site/settings";
import { getLocalized } from "@/lib/i18n/getLocalized";
import {
  getEmailMessages,
  type SupportedLocale,
} from "@/lib/i18n/getEmailMessages";
import type { BookingMode } from "@/lib/site/settings";
import { whatsappUrl } from "@/lib/whatsapp";

export interface ReservationLeg {
  reservationId: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  nights: number;
  totalPrice: number;
  depositAmount: number;
}

export interface ReservationEmailData {
  /** Shared by every leg of a group booking; null for a single reservation. */
  groupId: string | null;
  legs: ReservationLeg[];
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  locale: SupportedLocale;
  emailSubject: string | null;
  emailIntro: string | null;
  contactWhatsapp: string | null;
  bookingMode: BookingMode;
}

// What callers pass in. The settings-derived fields are filled in by
// sendReservationEmails.
export type ReservationEmailInput = Omit<
  ReservationEmailData,
  "emailSubject" | "emailIntro" | "contactWhatsapp" | "bookingMode"
>;

type EmailMessages = ReturnType<typeof getEmailMessages>;

const INTL_LOCALE: Record<SupportedLocale, string> = {
  es: "es-UY",
  en: "en-US",
  pt: "pt-BR",
};
// Assumption: en -> en-US, pt -> pt-BR. Flag if a different regional
// variant (e.g. pt-PT) is wanted.

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dateISO: string, locale: SupportedLocale): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function money(amount: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    maximumFractionDigits: 0,
  }).format(amount);
}

// "Cabaña A", "Cabaña A y Cabaña B", "Cabaña A, Cabaña B y Cabaña C"
function listNames(legs: ReservationLeg[], locale: SupportedLocale): string {
  return new Intl.ListFormat(INTL_LOCALE[locale], {
    style: "long",
    type: "conjunction",
  }).format(legs.map((l) => l.propertyName));
}

function sum(legs: ReservationLeg[], key: "totalPrice" | "depositAmount") {
  return legs.reduce((total, leg) => total + leg[key], 0);
}

// The one reference the guest sees and quotes back. Group bookings use the
// group id (shown on the admin Reservas card); singles use the reservation id.
function reference(data: Pick<ReservationEmailInput, "groupId" | "legs">) {
  return data.groupId ?? data.legs[0].reservationId;
}

const TABLE_STYLE =
  "width: 100%; margin: 16px 0; font-size: 14px; border-collapse: collapse;";
const HR = `<hr style="border: none; border-top: 1px solid #ddd; margin: 8px 0;">`;

function row(label: string, value: string): string {
  return `<tr><td style="padding: 4px 0;">${label}</td><td style="text-align: right;"><strong>${value}</strong></td></tr>`;
}

const WHATSAPP_CTA: Record<SupportedLocale, string> = {
  es: "Escríbenos por WhatsApp",
  en: "Message us on WhatsApp",
  pt: "Fale conosco no WhatsApp",
};

const PROPERTY_LABEL: Record<SupportedLocale, string> = {
  es: "Propiedad",
  en: "Property",
  pt: "Propriedade",
};

function whatsappButton(href: string | null, locale: SupportedLocale): string {
  if (!href) return "";
  return `<p><a href="${href}" style="display:inline-block;background:#25D366;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">${WHATSAPP_CTA[locale]}</a></p>`;
}

// ───────────── WhatsApp message copy ─────────────

const WA_COPY: Record<
  SupportedLocale,
  {
    intro: (name: string, isRequest: boolean) => string;
    nights: (n: number) => string;
    total: string;
    reference: string;
    receipt: string;
    toGuest: (
      name: string,
      isRequest: boolean,
      names: string,
      start: string,
      end: string,
    ) => string;
  }
> = {
  es: {
    intro: (name, isRequest) =>
      `¡Hola! Soy ${name}. ${isRequest ? "Acabo de enviar una solicitud de reserva" : "Acabo de hacer una reserva"}:`,
    nights: (n) => `${n} ${n === 1 ? "noche" : "noches"}`,
    total: "Total",
    reference: "Referencia",
    receipt: "Te envío el comprobante del depósito por aquí.",
    toGuest: (name, isRequest, names, start, end) =>
      `¡Hola ${name}! Te escribo por tu ${isRequest ? "solicitud de reserva" : "reserva"} en ${names}, del ${start} al ${end}.`,
  },
  en: {
    intro: (name, isRequest) =>
      `Hi! I'm ${name}. ${isRequest ? "I just sent a reservation request" : "I just made a reservation"}:`,
    nights: (n) => `${n} ${n === 1 ? "night" : "nights"}`,
    total: "Total",
    reference: "Reference",
    receipt: "I'll send the deposit receipt here.",
    toGuest: (name, isRequest, names, start, end) =>
      `Hi ${name}! I'm writing about your ${isRequest ? "reservation request" : "reservation"} for ${names}, ${start} to ${end}.`,
  },
  pt: {
    intro: (name, isRequest) =>
      `Olá! Sou ${name}. ${isRequest ? "Acabei de enviar uma solicitação de reserva" : "Acabei de fazer uma reserva"}:`,
    nights: (n) => `${n} ${n === 1 ? "noite" : "noites"}`,
    total: "Total",
    reference: "Referência",
    receipt: "Vou enviar o comprovante do sinal por aqui.",
    toGuest: (name, isRequest, names, start, end) =>
      `Olá ${name}! Escrevo sobre sua ${isRequest ? "solicitação de reserva" : "reserva"} para ${names}, de ${start} a ${end}.`,
  },
};

// Guest -> host. One line per cabin, so a group booking is one message.
function guestToHostMessage(data: ReservationEmailData): string {
  const c = WA_COPY[data.locale];
  const isRequest = data.bookingMode === "request";
  const lines = data.legs.map(
    (l) =>
      `• ${l.propertyName}: ${formatDate(l.startDate, data.locale)} → ${formatDate(l.endDate, data.locale)} (${c.nights(l.nights)})`,
  );

  return [
    c.intro(data.guestName, isRequest),
    ...lines,
    `${c.total}: $${money(sum(data.legs, "totalPrice"), data.locale)}`,
    `${c.reference}: ${reference(data)}`,
    ...(isRequest ? [] : [c.receipt]),
  ].join("\n");
}

// Host -> guest. Legs of a group always share dates, so the first leg's
// dates stand for all of them.
function hostToGuestMessage(data: ReservationEmailData): string {
  const first = data.legs[0];
  return WA_COPY[data.locale].toGuest(
    data.guestName,
    data.bookingMode === "request",
    listNames(data.legs, data.locale),
    formatDate(first.startDate, data.locale),
    formatDate(first.endDate, data.locale),
  );
}

// ───────────── Shared reservation tables (guest + status emails) ─────────────

function reservationTables(
  data: ReservationEmailInput,
  t: EmailMessages,
  showDeposit: boolean,
): string {
  const { legs, locale } = data;
  const multi = legs.length > 1;
  const deposit = sum(legs, "depositAmount");

  const legTables = legs.map(
    (leg) => `<table style="${TABLE_STYLE}">
      ${row(PROPERTY_LABEL[locale], escapeHtml(leg.propertyName))}
      ${row(t.checkIn, formatDate(leg.startDate, locale))}
      ${row(t.checkOut, formatDate(leg.endDate, locale))}
      ${row(t.nights, String(leg.nights))}
      ${multi ? row(t.total, `$${money(leg.totalPrice, locale)}`) : ""}
    </table>`,
  );

  const totals = `<table style="${TABLE_STYLE}">
      ${row(t.total, `$${money(sum(legs, "totalPrice"), locale)}`)}
      ${showDeposit && deposit > 0 ? row(t.depositDue, `$${money(deposit, locale)}`) : ""}
    </table>`;

  return [...legTables, totals].join(multi ? HR : "");
}

// ───────────── Default copy (used when the admin hasn't set custom copy) ─────────────
// The bank account line is intentionally left as a hardcoded placeholder — see
// TO_DO.md "Deposit bank-account info is hardcoded".

const DEFAULT_SUBJECT: Record<
  SupportedLocale,
  (propertyName: string) => string
> = {
  es: (name) => `Recibimos tu solicitud de reserva — ${name}`,
  en: (name) => `We received your reservation request — ${name}`,
  pt: (name) => `Recebemos sua solicitação de reserva — ${name}`,
};

const REQUEST_INTRO: Record<
  SupportedLocale,
  (propertyName: string, whatsapp: string) => string
> = {
  es: (name, whatsapp) => `
    <p>Recibimos tu solicitud de reserva para <strong>${name}</strong>.</p>
    <p>Todavía no está confirmada: te contactaremos a la brevedad para confirmar la disponibilidad e indicarte cómo realizar el depósito. También puedes contactarnos por WhatsApp al ${whatsapp} para confirmar la reserva.</p>
  `,
  en: (name, whatsapp) => `
    <p>We received your reservation request for <strong>${name}</strong>.</p>
    <p>It isn't confirmed yet: we'll contact you shortly to confirm availability and let you know how to make the deposit. You can also contact us on WhatsApp at ${whatsapp} to confirm the reservation.</p>
  `,
  pt: (name, whatsapp) => `
    <p>Recebemos sua solicitação de reserva para <strong>${name}</strong>.</p>
    <p>Ela ainda não está confirmada: entraremos em contato em breve para confirmar a disponibilidade e informar como fazer o sinal. Você também pode entrar em contato conosco pelo WhatsApp ${whatsapp} para confirmar a reserva.</p>
  `,
};

const DEFAULT_INTRO: Record<
  SupportedLocale,
  (propertyName: string, whatsapp: string) => string
> = {
  es: (name, whatsapp) => `
    <p>Recibimos tu solicitud de reserva para <strong>${name}</strong>.</p>
    <p>La misma estará pendiente de confirmación durante las siguientes 24 horas. Para confirmar tu reserva, pedimos un depósito del 50% del total de la misma. En caso de no recibir el depósito, la reserva se cancelará y se liberarán las fechas en el calendario.</p>
    <p>Puedes hacer tu depósito a la siguiente cuenta:</p>
    <p>BROU: xxxxxxxx</p>
    <p>Una vez realizada, contactanos por WhatsApp al ${whatsapp} para enviarnos el comprobante.</p>
  `,
  en: (name, whatsapp) => `
    <p>We received your reservation request for <strong>${name}</strong>.</p>
    <p>It will remain pending confirmation for the next 24 hours. To confirm your reservation, we require a deposit of 50% of the total. If the deposit isn't received, the reservation will be cancelled and the dates released on the calendar.</p>
    <p>You can make your deposit to the following account:</p>
    <p>BROU: xxxxxxxx</p>
    <p>Once done, contact us on WhatsApp at ${whatsapp} to send us proof of payment.</p>
  `,
  pt: (name, whatsapp) => `
    <p>Recebemos sua solicitação de reserva para <strong>${name}</strong>.</p>
    <p>Ela ficará pendente de confirmação pelas próximas 24 horas. Para confirmar sua reserva, pedimos um sinal de 50% do total. Caso o sinal não seja recebido, a reserva será cancelada e as datas liberadas no calendário.</p>
    <p>Você pode fazer o sinal na seguinte conta:</p>
    <p>BROU: xxxxxxxx</p>
    <p>Depois de feito, entre em contato conosco pelo WhatsApp ${whatsapp} para enviar o comprovante.</p>
  `,
};

// ───────────── Guest email (one per booking, however many cabins) ─────────────

export async function sendGuestConfirmationEmail(data: ReservationEmailData) {
  const t = getEmailMessages(data.locale);
  const plainNames = listNames(data.legs, data.locale);

  const subject = data.emailSubject || DEFAULT_SUBJECT[data.locale](plainNames);

  const waHref = whatsappUrl(data.contactWhatsapp, guestToHostMessage(data));
  const whatsappHtml = data.contactWhatsapp
    ? waHref
      ? `<a href="${waHref}">${escapeHtml(data.contactWhatsapp)}</a>`
      : escapeHtml(data.contactWhatsapp)
    : "";

  const defaultIntro = (
    data.bookingMode === "request" ? REQUEST_INTRO : DEFAULT_INTRO
  )[data.locale](escapeHtml(plainNames), whatsappHtml);

  const intro = data.emailIntro || defaultIntro;

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: data.guestEmail,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${t.greeting.replace("{name}", escapeHtml(data.guestName))}</h2>
        <div>${intro}</div>
        ${reservationTables(data, t, true)}
        ${whatsappButton(waHref, data.locale)}
        <p style="color: #666; font-size: 13px;">${t.referenceNumber}: ${reference(data)}</p>
      </div>
    `,
  });
}

// ───────────── Admin email ─────────────
// Stays Spanish-only intentionally — goes to the business owner, not the
// guest, so there's no reason to localize it.

export async function sendAdminNotificationEmail(data: ReservationEmailData) {
  if (!ADMIN_EMAIL) {
    console.error("ADMIN_NOTIFICATION_EMAIL is not set — skipping admin email");
    return;
  }

  const guestName = escapeHtml(data.guestName);
  const guestEmail = escapeHtml(data.guestEmail);
  const guestPhoneText = data.guestPhone ? escapeHtml(data.guestPhone) : "—";
  const waLink = whatsappUrl(data.guestPhone, hostToGuestMessage(data));
  const guestPhone =
    data.guestPhone && waLink
      ? `<a href="${waLink}" style="color:#128C7E;text-decoration:underline;">${guestPhoneText}</a>`
      : guestPhoneText;

  const requestNote =
    data.bookingMode === "request"
      ? `<p style="background:#fff7e6;padding:12px;border-radius:6px;font-size:14px;">
           Recuerda bloquear manualmente estas fechas en el calendario de tu sitio o a través de tu extranet una vez recibido el depósito.
         </p>`
      : "";

  const multi = data.legs.length > 1;

  const legTables = data.legs.map(
    (leg) => `<table style="${TABLE_STYLE}">
      ${row("Propiedad", escapeHtml(leg.propertyName))}
      ${row("Check-in", formatDate(leg.startDate, "es"))}
      ${row("Check-out", formatDate(leg.endDate, "es"))}
      ${row("Noches", String(leg.nights))}
      ${row("Total", `$${money(leg.totalPrice, "es")}`)}
      ${row("Seña", `$${money(leg.depositAmount, "es")}`)}
    </table>`,
  );

  const totals = multi
    ? `<table style="${TABLE_STYLE}">
      ${row("Total de las " + data.legs.length + " cabañas", `$${money(sum(data.legs, "totalPrice"), "es")}`)}
      ${row("Seña total", `$${money(sum(data.legs, "depositAmount"), "es")}`)}
    </table>`
    : "";

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    replyTo: data.guestEmail,
    subject: `Nueva solicitud de reserva — ${listNames(data.legs, "es")}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Nueva solicitud de reserva</h2>
        ${requestNote}
        <table style="${TABLE_STYLE}">
          ${row("Huésped", guestName)}
          ${row("Email", guestEmail)}
          ${row("Teléfono", guestPhone)}
        </table>
        ${[...legTables, totals].filter(Boolean).join(HR)}
        ${
          waLink
            ? `<p><a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">Escribirle por WhatsApp</a></p>`
            : ""
        }
        <p style="color: #666; font-size: 13px;">ID de reserva: ${reference(data)}</p>
      </div>
    `,
  });
}

// Sends both independently. A failure in one shouldn't block the other,
// and neither failure should ever undo the reservation itself — by the
// time this runs, it's already committed to the DB.
//
// Also returns the guest -> host WhatsApp link so the booking routes can
// show it as a button on the confirmation screen.
export async function sendReservationEmails(
  data: ReservationEmailInput,
): Promise<{ guestWhatsappUrl: string | null }> {
  const { emailSubject, emailIntro, contactWhatsapp, bookingMode } =
    await getContactSettings();

  const fullData: ReservationEmailData = {
    ...data,
    emailSubject: emailSubject ? getLocalized(emailSubject, data.locale) : null,
    emailIntro: emailIntro ? getLocalized(emailIntro, data.locale) : null,
    contactWhatsapp,
    bookingMode,
  };

  const results = await Promise.allSettled([
    sendGuestConfirmationEmail(fullData),
    sendAdminNotificationEmail(fullData),
  ]);

  results.forEach((result, i) => {
    const who = i === 0 ? "guest" : "admin";
    if (result.status === "rejected") {
      console.error(`Failed to send ${who} email:`, result.reason);
    } else if (result.value?.error) {
      // Resend resolves with { error } instead of throwing on API failures.
      console.error(`Resend rejected ${who} email:`, result.value.error);
    }
  });

  return {
    guestWhatsappUrl: whatsappUrl(
      contactWhatsapp,
      guestToHostMessage(fullData),
    ),
  };
}

// ───────────── Status emails (confirmed / cancelled) ─────────────
// Sent from the admin per reservation, so `legs` holds a single cabin here.

export type StatusEmailData = ReservationEmailInput;

const STATUS_COPY: Record<
  "confirmed" | "cancelled",
  Record<
    SupportedLocale,
    { subject: (n: string) => string; body: (n: string) => string }
  >
> = {
  confirmed: {
    es: {
      subject: (n) => `Reserva confirmada — ${n}`,
      body: (n) =>
        `<p>¡Tu reserva en <strong>${n}</strong> está confirmada! Te esperamos.</p>`,
    },
    en: {
      subject: (n) => `Reservation confirmed — ${n}`,
      body: (n) =>
        `<p>Your reservation at <strong>${n}</strong> is confirmed! We look forward to hosting you.</p>`,
    },
    pt: {
      subject: (n) => `Reserva confirmada — ${n}`,
      body: (n) =>
        `<p>Sua reserva em <strong>${n}</strong> está confirmada! Esperamos você.</p>`,
    },
  },
  cancelled: {
    es: {
      subject: (n) => `Reserva cancelada — ${n}`,
      body: (n) =>
        `<p>Tu reserva en <strong>${n}</strong> fue cancelada y las fechas quedaron liberadas. Si tienes alguna consulta, escríbenos por WhatsApp.</p>`,
    },
    en: {
      subject: (n) => `Reservation cancelled — ${n}`,
      body: (n) =>
        `<p>Your reservation at <strong>${n}</strong> was cancelled and the dates have been released. If you have any questions, message us on WhatsApp.</p>`,
    },
    pt: {
      subject: (n) => `Reserva cancelada — ${n}`,
      body: (n) =>
        `<p>Sua reserva em <strong>${n}</strong> foi cancelada e as datas foram liberadas. Se tiver alguma dúvida, fale conosco no WhatsApp.</p>`,
    },
  },
};

const REFERENCE_MESSAGE: Record<
  SupportedLocale,
  (p: string, ref: string) => string
> = {
  es: (p, ref) =>
    `¡Hola! Te escribo por mi reserva en ${p}. Referencia: ${ref}.`,
  en: (p, ref) =>
    `Hi! I'm writing about my reservation at ${p}. Reference: ${ref}.`,
  pt: (p, ref) =>
    `Olá! Escrevo sobre minha reserva em ${p}. Referência: ${ref}.`,
};

export async function sendReservationStatusEmail(
  data: StatusEmailData,
  kind: "confirmed" | "cancelled",
) {
  const t = getEmailMessages(data.locale);
  const { contactWhatsapp } = await getContactSettings();
  const copy = STATUS_COPY[kind][data.locale];
  const plainNames = listNames(data.legs, data.locale);

  const waHref = whatsappUrl(
    contactWhatsapp,
    REFERENCE_MESSAGE[data.locale](plainNames, reference(data)),
  );

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.guestEmail,
    subject: copy.subject(plainNames),
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${t.greeting.replace("{name}", escapeHtml(data.guestName))}</h2>
        ${copy.body(escapeHtml(plainNames))}
        ${reservationTables(data, t, false)}
        ${whatsappButton(waHref, data.locale)}
        <p style="color: #666; font-size: 13px;">${t.referenceNumber}: ${reference(data)}</p>
      </div>
    `,
  });

  if (result.error) throw new Error(result.error.message);
  return result;
}
