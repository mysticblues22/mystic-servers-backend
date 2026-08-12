export type SupportedPaymentCurrency = "USD" | "INR";

export interface CurrencyMetadata {
  code: string;
  name: string;
  symbol: string;
  minorUnit: number;
}

export interface ExchangeRate {
  base: "USD";
  target: string;
  rate: number;
  retrievedAt: Date;
  isStale: boolean;
  providerType: "static_fallback" | "live";
}

export const CURRENCY_METADATA: Record<string, CurrencyMetadata> = {
  USD: { code: "USD", name: "US Dollar", symbol: "$", minorUnit: 2 },
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", minorUnit: 2 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", minorUnit: 2 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", minorUnit: 2 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "CA$", minorUnit: 2 },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$", minorUnit: 2 },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$", minorUnit: 2 },
  AED: { code: "AED", name: "United Arab Emirates Dirham", symbol: "AED ", minorUnit: 2 },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "SAR ", minorUnit: 2 },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", minorUnit: 0 },
};

const SUPPORTED_PAYMENT_CURRENCIES: SupportedPaymentCurrency[] = ["USD", "INR"];

// Fallback rates relative to USD (1 USD = X target currency)
const STATIC_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 85.0,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.36,
  AUD: 1.52,
  SGD: 1.34,
  AED: 3.67,
  SAR: 3.75,
  JPY: 155.0,
};

class ExchangeRateService {
  private ratesCache: Map<string, number> = new Map();
  private retrievedAt: Date = new Date();
  private cacheTtlMs: number = 3600 * 1000; // 1 hour TTL
  private isStaleCache: boolean = false;
  public readonly providerType: "static_fallback" | "live" = "static_fallback";

  constructor() {
    for (const [code, rate] of Object.entries(STATIC_RATES)) {
      this.ratesCache.set(code, rate);
    }
  }

  public getRate(targetCurrency: string): ExchangeRate {
    const code = targetCurrency.toUpperCase();
    const rate = this.ratesCache.get(code) || STATIC_RATES[code] || 1.0;

    const age = Date.now() - this.retrievedAt.getTime();
    const isStale = this.isStaleCache || age > this.cacheTtlMs;

    return {
      base: "USD",
      target: code,
      rate,
      retrievedAt: this.retrievedAt,
      isStale,
      providerType: this.providerType,
    };
  }

  public updateRates(newRates: Record<string, number>, retrievedAt: Date = new Date()) {
    for (const [code, rate] of Object.entries(newRates)) {
      this.ratesCache.set(code.toUpperCase(), rate);
    }
    this.retrievedAt = retrievedAt;
    this.isStaleCache = false;
  }

  public markStale() {
    this.isStaleCache = true;
  }

  public getAllSupportedCurrencies(): CurrencyMetadata[] {
    return Object.values(CURRENCY_METADATA);
  }
}

export const exchangeRateService = new ExchangeRateService();

export function isSupportedPaymentCurrency(
  currency: string,
): currency is SupportedPaymentCurrency {
  return SUPPORTED_PAYMENT_CURRENCIES.includes(currency.toUpperCase() as SupportedPaymentCurrency);
}

/**
 * Calculates display amount for frontend UI in minor units according to target currency minorUnit rules.
 */
export function convertUsdCentsToTargetCurrency(
  usdCents: number,
  targetCurrency: string,
) {
  const code = targetCurrency.toUpperCase();
  const meta = CURRENCY_METADATA[code] || {
    code,
    name: code,
    symbol: "$",
    minorUnit: 2,
  };

  const rateInfo = exchangeRateService.getRate(code);
  const usdAmount = usdCents / 100;
  const convertedValue = usdAmount * rateInfo.rate;

  let amountMinorUnits: number;
  let formatted: string;

  if (meta.minorUnit === 0) {
    amountMinorUnits = Math.round(convertedValue);
    formatted = `${meta.symbol}${amountMinorUnits.toLocaleString()}`;
  } else {
    amountMinorUnits = Math.round(convertedValue * Math.pow(10, meta.minorUnit));
    formatted = `${meta.symbol}${convertedValue.toFixed(meta.minorUnit)}`;
  }

  return {
    currency: code,
    symbol: meta.symbol,
    minorUnit: meta.minorUnit,
    amountMinorUnits,
    amountFormatted: formatted,
    rateVsUsd: rateInfo.rate,
    retrievedAt: rateInfo.retrievedAt,
    isStale: rateInfo.isStale,
    providerType: rateInfo.providerType,
  };
}

/**
 * Authoritative Plan Price Calculator
 * Resolves authoritative price for India vs International, and calculates display conversion.
 * Explicit displayCurrency selection overrides region default.
 */
export function resolvePlanPrice(
  plan: {
    monthlyPriceCents: number;
    annualPriceCents: number;
    monthlyPriceInrCents?: number | null;
    annualPriceInrCents?: number | null;
  },
  billingCycle: "monthly" | "annual",
  displayCurrency?: string,
  region?: string,
) {
  const isMonthly = billingCycle === "monthly";
  const upperRegion = (region || "INTL").toUpperCase();

  // Default region currency: IN -> INR, INTL -> USD
  const targetCurrency = (displayCurrency || (upperRegion === "IN" ? "INR" : "USD")).toUpperCase();

  // 1. India Region Pricing (when display currency is INR)
  if (targetCurrency === "INR") {
    const configuredInrCents = isMonthly
      ? plan.monthlyPriceInrCents
      : plan.annualPriceInrCents;

    if (configuredInrCents != null) {
      return {
        isConfigured: true,
        pricingRegion: "IN" as const,
        sourceCurrency: "INR" as const,
        sourceAmountCents: configuredInrCents,
        displayCurrency: "INR",
        displayAmountMinorUnits: configuredInrCents,
        displayFormatted: `₹${(configuredInrCents / 100).toFixed(2)}`,
        exchangeRateVsUsd: exchangeRateService.getRate("INR").rate,
        isStale: false,
      };
    }

    return {
      isConfigured: false,
      pricingRegion: "IN" as const,
      sourceCurrency: "INR" as const,
      sourceAmountCents: null,
      displayCurrency: "INR",
      displayAmountMinorUnits: null,
      displayFormatted: "Unconfigured (Contact Sales)",
      exchangeRateVsUsd: exchangeRateService.getRate("INR").rate,
      isStale: false,
    };
  }

  // 2. International USD Pricing (Default Canonical Base)
  const usdSourceCents = isMonthly
    ? plan.monthlyPriceCents
    : plan.annualPriceCents;

  if (targetCurrency === "USD") {
    return {
      isConfigured: true,
      pricingRegion: upperRegion === "IN" ? ("IN" as const) : ("INTL" as const),
      sourceCurrency: "USD" as const,
      sourceAmountCents: usdSourceCents,
      displayCurrency: "USD",
      displayAmountMinorUnits: usdSourceCents,
      displayFormatted: `$${(usdSourceCents / 100).toFixed(2)}`,
      exchangeRateVsUsd: 1.0,
      isStale: false,
    };
  }

  // 3. International Display Conversion (Base: USD -> Target Currency)
  const converted = convertUsdCentsToTargetCurrency(usdSourceCents, targetCurrency);

  return {
    isConfigured: true,
    pricingRegion: upperRegion === "IN" ? ("IN" as const) : ("INTL" as const),
    sourceCurrency: "USD" as const,
    sourceAmountCents: usdSourceCents,
    displayCurrency: converted.currency,
    displayAmountMinorUnits: converted.amountMinorUnits,
    displayFormatted: converted.amountFormatted,
    exchangeRateVsUsd: converted.rateVsUsd,
    isStale: converted.isStale,
  };
}

/**
 * Calculates authoritative payment amount for Razorpay payment processing (USD or INR).
 */
export function calculatePaymentAmount(
  amountUsdCents: number,
  targetCurrency: SupportedPaymentCurrency,
): { amountCents: number; currency: SupportedPaymentCurrency } {
  if (targetCurrency === "USD") {
    return { amountCents: Math.round(amountUsdCents), currency: "USD" };
  }

  if (targetCurrency === "INR") {
    const rateInfo = exchangeRateService.getRate("INR");
    const inrPaise = Math.round(amountUsdCents * rateInfo.rate);
    return { amountCents: inrPaise, currency: "INR" };
  }

  throw new Error(`Unsupported payment currency: ${targetCurrency}`);
}
