export type LocalizedText = { es: string; en?: string; pt?: string };

export function getLocalized(
  field: LocalizedText | null | undefined,
  locale: string,
): string {
  if (!field) return "";
  const value = field[locale as keyof LocalizedText];
  return value?.trim() ? value : (field.es ?? "");
}
