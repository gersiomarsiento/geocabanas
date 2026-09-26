import {
  convertFromUSD,
  formatCurrency,
  DEFAULT_EXCHANGE_RATES,
} from "@/lib/currency/index";

function digitsOnly(formatted: string): string {
  return formatted.replace(/[^0-9]/g, "");
}

describe("convertFromUSD", () => {
  it("returns the amount unchanged for USD (rate 1)", () => {
    expect(convertFromUSD(100, "USD", DEFAULT_EXCHANGE_RATES)).toBe(100);
  });

  it("converts to UYU using the default rate", () => {
    expect(convertFromUSD(100, "UYU", DEFAULT_EXCHANGE_RATES)).toBe(4250);
  });

  it("converts to BRL using the default rate", () => {
    expect(convertFromUSD(100, "BRL", DEFAULT_EXCHANGE_RATES)).toBe(540);
  });

  it("uses whatever rates object is passed in, not the defaults", () => {
    const customRates = { USD: 1, UYU: 40, BRL: 5 };
    expect(convertFromUSD(100, "UYU", customRates)).toBe(4000);
  });

  it("returns 0 for an amount of 0", () => {
    expect(convertFromUSD(0, "UYU", DEFAULT_EXCHANGE_RATES)).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("includes the correct digits, grouping included, for a whole number", () => {
    expect(digitsOnly(formatCurrency(1234, "UYU"))).toBe("1234");
  });

  it("rounds down correctly given maximumFractionDigits: 0", () => {
    expect(digitsOnly(formatCurrency(99.4, "BRL"))).toBe("99");
  });

  it("rounds up correctly given maximumFractionDigits: 0", () => {
    expect(digitsOnly(formatCurrency(99.6, "BRL"))).toBe("100");
  });

  it("produces different output for different currencies at the same amount", () => {
    // Sanity check that the currency param actually reaches Intl.NumberFormat
    // rather than being ignored — symbols/codes should differ even if the
    // digit grouping happens to look similar.
    const usd = formatCurrency(100, "USD");
    const uyu = formatCurrency(100, "UYU");
    expect(usd).not.toBe(uyu);
  });
});
