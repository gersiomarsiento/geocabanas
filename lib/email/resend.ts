// lib/email/resend.ts
//
// Server-only. Don't import this from a "use client" component.
 
import { Resend } from "resend";
 
export const resend = new Resend(process.env.RESEND_API_KEY);
 
// Using Resend's shared sandbox sender for now — works immediately, no
// domain verification needed. Swap this once you verify your own domain
// (e.g. "Geocabañas <reservas@geocabanas.com>").
export const FROM_ADDRESS = "Geocabañas <onboarding@resend.dev>";
 
// Where guest-facing notification emails (new reservation, etc.) go.
// Put the real admin inbox in .env.local as ADMIN_NOTIFICATION_EMAIL.
export const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL as string;
 