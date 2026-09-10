// lib/email/reservationEmails.ts

import { resend, FROM_ADDRESS, ADMIN_EMAIL } from "./resend";
import { getContactSettings } from "@/lib/site/settings";
import { getLocalized } from "@/lib/i18n/getLocalized";
import {
  getEmailMessages,
  type SupportedLocale,
} from "@/lib/i18n/getEmailMessages";

export interface ReservationEmailData {
  reservationId: string;
  propertyName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  startDate: string;
  endDate: string;
  nights: number;
  totalPrice: number;
  depositAmount: number;
  locale: SupportedLocale;
  emailSubject: string | null;
  emailIntro: string | null;
  contactWhatsapp: string | null;
}

const INTL_LOCALE: Record<SupportedLocale, string> = {
  es: "es-UY",
  en: "en-US",
  pt: "pt-BR",
};
// Assumption: en -> en-US, pt -> pt-BR. Flag if a different regional
// variant (e.g. pt-PT) is wanted.

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

// Fallback subject/intro used only when the admin hasn't set custom copy
// for this locale (see SiteEmailCard / TranslationsSiteCard). The bank
// account line is intentionally left as a hardcoded placeholder — see
// TO_DO.md "Deposit bank-account info is hardcoded".
const DEFAULT_SUBJECT: Record<
  SupportedLocale,
  (propertyName: string) => string
> = {
  es: (name) => `Recibimos tu solicitud de reserva — ${name}`,
  en: (name) => `We received your reservation request — ${name}`,
  pt: (name) => `Recebemos sua solicitação de reserva — ${name}`,
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

export async function sendGuestConfirmationEmail(data: ReservationEmailData) {
  const t = getEmailMessages(data.locale);
  const subject =
    data.emailSubject || DEFAULT_SUBJECT[data.locale](data.propertyName);
  const intro =
    data.emailIntro ||
    DEFAULT_INTRO[data.locale](data.propertyName, data.contactWhatsapp ?? "");

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: data.guestEmail,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${t.greeting.replace("{name}", data.guestName)}</h2>
        <div>${intro}</div>
        <table style="width: 100%; margin: 16px 0; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 4px 0;">${data.locale == "es" ? "Propiedad" : data.locale == "en" ? "Property" : "Propiedade"}</td><td style="text-align: right;"><strong>${data.propertyName}</strong></td></tr>
          <tr><td style="padding: 4px 0;">${t.checkIn}</td><td style="text-align: right;"><strong>${formatDate(data.startDate, data.locale)}</strong></td></tr>
          <tr><td style="padding: 4px 0;">${t.checkOut}</td><td style="text-align: right;"><strong>${formatDate(data.endDate, data.locale)}</strong></td></tr>
          <tr><td style="padding: 4px 0;">${t.nights}</td><td style="text-align: right;"><strong>${data.nights}</strong></td></tr>
          <tr><td style="padding: 4px 0;">${t.total}</td><td style="text-align: right;"><strong>$${money(data.totalPrice, data.locale)}</strong></td></tr>
          ${
            data.depositAmount > 0
              ? `<tr><td style="padding: 4px 0;">${t.depositDue}</td><td style="text-align: right;"><strong>$${money(data.depositAmount, data.locale)}</strong></td></tr>`
              : ""
          }
        </table>
        <p style="color: #666; font-size: 13px;">${t.referenceNumber}: ${data.reservationId}</p>
      </div>
    `,
  });
}

// Stays Spanish-only intentionally — goes to the business owner, not the
// guest, so there's no reason to localize it.
export async function sendAdminNotificationEmail(data: ReservationEmailData) {
  if (!ADMIN_EMAIL) {
    console.error("ADMIN_NOTIFICATION_EMAIL is not set — skipping admin email");
    return;
  }

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject: `Nueva solicitud de reserva — ${data.propertyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Nueva solicitud de reserva</h2>
        <table style="width: 100%; margin: 16px 0; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 4px 0;">Propiedad</td><td style="text-align: right;"><strong>${data.propertyName}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Huésped</td><td style="text-align: right;"><strong>${data.guestName}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Email</td><td style="text-align: right;"><strong>${data.guestEmail}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Teléfono</td><td style="text-align: right;"><strong>${data.guestPhone ?? "—"}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Check-in</td><td style="text-align: right;"><strong>${formatDate(data.startDate, "es")}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Check-out</td><td style="text-align: right;"><strong>${formatDate(data.endDate, "es")}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Noches</td><td style="text-align: right;"><strong>${data.nights}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Total</td><td style="text-align: right;"><strong>$${money(data.totalPrice, "es")}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Seña</td><td style="text-align: right;"><strong>$${money(data.depositAmount, "es")}</strong></td></tr>
        </table>
        <p style="color: #666; font-size: 13px;">ID de reserva: ${data.reservationId}</p>
      </div>
    `,
  });
}

// Sends both independently. A failure in one shouldn't block the other,
// and neither failure should ever undo the reservation itself — by the
// time this runs, it's already committed to the DB.
export async function sendReservationEmails(
  data: Omit<
    ReservationEmailData,
    "emailSubject" | "emailIntro" | "contactWhatsapp"
  >,
) {
  const { emailSubject, emailIntro, contactWhatsapp } =
    await getContactSettings();

  const fullData: ReservationEmailData = {
    ...data,
    emailSubject: emailSubject ? getLocalized(emailSubject, data.locale) : null,
    emailIntro: emailIntro ? getLocalized(emailIntro, data.locale) : null,
    contactWhatsapp,
  };
  const results = await Promise.allSettled([
    sendGuestConfirmationEmail(fullData),
    sendAdminNotificationEmail(fullData),
  ]);

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to send ${i === 0 ? "guest" : "admin"} email:`,
        result.reason,
      );
    }
  });
}
