// lib/whatsapp.ts
const DEFAULT_COUNTRY_CODE = "598"; // Uruguay: 099 123 456 -> 598 99 123 456

export function normalizeWhatsappNumber(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0"))
    digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function whatsappUrl(
  raw: string | null | undefined,
  text?: string,
): string | null {
  const number = normalizeWhatsappNumber(raw);
  if (!number) return null;
  return text
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${number}`;
}
