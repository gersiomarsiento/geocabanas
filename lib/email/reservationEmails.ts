// lib/email/reservationEmails.ts

import { resend, FROM_ADDRESS, ADMIN_EMAIL } from "./resend";
import { getContactSettings } from "@/lib/site/settings";

export interface ReservationEmailData {
  reservationId: string;
  propertyName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  nights: number;
  totalPrice: number;
  depositAmount: number;
  emailSubject: string | null;
  emailIntro: string | null;
}

function formatDate(dateISO: string): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-UY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function money(amount: number): string {
  return new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(
    amount,
  );
}

export async function sendGuestConfirmationEmail(data: ReservationEmailData) {
  return resend.emails.send({
    from: FROM_ADDRESS,
    to: data.guestEmail,
    subject:
      data.emailSubject ??
      `Recibimos tu solicitud de reserva — ${data.propertyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>¡Gracias, ${data.guestName}!</h2>
        <div>${
          data.emailIntro ??
          `<p>Recibimos tu solicitud de reserva para <strong>${data.propertyName}</strong>.</p>
        <p>La misma estará pendiente de confirmación durante las siguientes 24 horas. Para confirmar tu reserva, pedimos un depósito del 50% del total de la misma. En caso de no recibir el depósito, la reserva se cancelará y se liberarán las fechas en el calendario.</p>
        <p>Puedes hacer tu depósito a la siguiente cuenta:</p>
        <p>BROU: xxxxxxxx</p>
        <p>Una vez realizada, contactanos por WhatsApp al +598 1234 1234 para enviarnos el comprobante.</p>`
        }</div>
        <table style="width: 100%; margin: 16px 0; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 4px 0;">Check-in</td><td style="text-align: right;"><strong>${formatDate(data.startDate)}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Check-out</td><td style="text-align: right;"><strong>${formatDate(data.endDate)}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Noches</td><td style="text-align: right;"><strong>${data.nights}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Total</td><td style="text-align: right;"><strong>$${money(data.totalPrice)}</strong></td></tr>
          ${
            data.depositAmount > 0
              ? `<tr><td style="padding: 4px 0;">Seña requerida</td><td style="text-align: right;"><strong>$${money(data.totalPrice / 2)}</strong></td></tr>`
              : ""
          }
        </table>
        <p style="color: #666; font-size: 13px;">Número de referencia: ${data.reservationId}</p>
      </div>
    `,
  });
}

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
          <tr><td style="padding: 4px 0;">Check-in</td><td style="text-align: right;"><strong>${formatDate(data.startDate)}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Check-out</td><td style="text-align: right;"><strong>${formatDate(data.endDate)}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Noches</td><td style="text-align: right;"><strong>${data.nights}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Total</td><td style="text-align: right;"><strong>$${money(data.totalPrice)}</strong></td></tr>
          <tr><td style="padding: 4px 0;">Seña</td><td style="text-align: right;"><strong>$${money(data.depositAmount)}</strong></td></tr>
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
  data: Omit<ReservationEmailData, "emailSubject" | "emailIntro">,
) {
  const { emailSubject, emailIntro } = await getContactSettings();
  const fullData: ReservationEmailData = { ...data, emailSubject, emailIntro };

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
