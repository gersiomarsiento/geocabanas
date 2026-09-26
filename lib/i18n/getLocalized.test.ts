import { getLocalized } from "@/lib/i18n/getLocalized";

describe("getLocalized", () => {
  it("returns an empty string when the field is null", () => {
    expect(getLocalized(null, "es")).toBe("");
  });

  it("returns an empty string when the field is undefined", () => {
    expect(getLocalized(undefined, "es")).toBe("");
  });

  it("returns the es value when locale is es", () => {
    const field = { es: "Hola" };
    expect(getLocalized(field, "es")).toBe("Hola");
  });

  it("returns the matching locale value when present", () => {
    const field = { es: "Hola", en: "Hello", pt: "Olá" };
    expect(getLocalized(field, "en")).toBe("Hello");
    expect(getLocalized(field, "pt")).toBe("Olá");
  });

  it("falls back to es when the requested locale key is missing", () => {
    const field = { es: "Hola" };
    expect(getLocalized(field, "en")).toBe("Hola");
    expect(getLocalized(field, "pt")).toBe("Hola");
  });

  it("falls back to es for a locale outside es/en/pt entirely", () => {
    const field = { es: "Hola", en: "Hello" };
    expect(getLocalized(field, "fr")).toBe("Hola");
  });

  // Documents current behavior, not necessarily desired behavior — see
  // conversation notes. An explicitly empty translation is treated the
  // same as a missing one, because `field[locale] || field.es` can't
  // distinguish "" from undefined.
  it("falls back to es when the requested locale's value is an empty string", () => {
    const field = { es: "Hola", en: "" };
    expect(getLocalized(field, "en")).toBe("Hola");
  });
});
