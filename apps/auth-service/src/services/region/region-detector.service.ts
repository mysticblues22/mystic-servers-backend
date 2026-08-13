import type { FastifyRequest } from "fastify";

export interface DetectedRegion {
  countryCode: string;
  regionCode: string;
  regionName: string;
  defaultCurrency: string;
}

export function detectRegionFromRequest(request: FastifyRequest): DetectedRegion {
  const cfCountry = request.headers["cf-ipcountry"];
  const xCountry = request.headers["x-country-code"];

  const rawCountry = Array.isArray(cfCountry)
    ? cfCountry[0]
    : Array.isArray(xCountry)
      ? xCountry[0]
      : cfCountry || xCountry || "US";

  const country = String(rawCountry).toUpperCase().trim();

  if (country === "IN") {
    return {
      countryCode: "IN",
      regionCode: "IN",
      regionName: "India (Asia-South)",
      defaultCurrency: "INR",
    };
  }

  if (["DE", "FR", "NL", "ES", "IT", "FI", "EU"].includes(country)) {
    return {
      countryCode: country,
      regionCode: "EU",
      regionName: "Europe (Frankfurt)",
      defaultCurrency: "EUR",
    };
  }

  if (country === "GB") {
    return {
      countryCode: "GB",
      regionCode: "UK",
      regionName: "United Kingdom (London)",
      defaultCurrency: "GBP",
    };
  }

  if (country === "JP") {
    return {
      countryCode: "JP",
      regionCode: "JP",
      regionName: "Japan (Tokyo)",
      defaultCurrency: "JPY",
    };
  }

  return {
    countryCode: country,
    regionCode: "US",
    regionName: "United States (US-East)",
    defaultCurrency: "USD",
  };
}
