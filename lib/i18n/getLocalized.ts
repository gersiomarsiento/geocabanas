export type LocalizedText = { es: string; en?: string; pt?: string };

export function getLocalized(
  field: LocalizedText | null | undefined,
  locale: string,
): string {
  if (!field) return "";
  return field[locale as keyof LocalizedText] || field.es;
}
