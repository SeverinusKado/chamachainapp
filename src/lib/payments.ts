// Fiat on-ramp data for the deposit flow, scoped to the African markets with
// the deepest crypto / stablecoin adoption (Kenya, Ghana, Nigeria, Uganda,
// South Africa). Selecting a country drives the local currency, exchange rate,
// and the mobile-money providers / banks available for that market.
//
// NOTE: exchange rates are illustrative (local units per 1 USD) and are only
// used to show an approximate fiat amount alongside the USDC/USDT value.

export interface MobileMoneyProvider {
  id: string;
  name: string;
}

export interface AfricaCountry {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string; // emoji
  currency: string; // ISO 4217
  dialCode: string; // e.g. +254
  usdRate: number; // local currency units per 1 USD
  mobileMoney: MobileMoneyProvider[];
  banks: string[];
}

export const AFRICA_COUNTRIES: AfricaCountry[] = [
  {
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    currency: "KES",
    dialCode: "+254",
    usdRate: 154,
    mobileMoney: [
      { id: "mpesa", name: "M-Pesa" },
      { id: "airtel", name: "Airtel Money" },
    ],
    banks: ["Equity Bank", "KCB", "Co-operative Bank", "Absa Kenya"],
  },
  {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    currency: "GHS",
    dialCode: "+233",
    usdRate: 15,
    mobileMoney: [
      { id: "mtn", name: "MTN MoMo" },
      { id: "telecel", name: "Telecel Cash" },
      { id: "airteltigo", name: "AirtelTigo Money" },
    ],
    banks: ["GCB Bank", "Ecobank Ghana", "Fidelity Bank", "Absa Ghana"],
  },
  {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    dialCode: "+234",
    usdRate: 1550,
    mobileMoney: [
      { id: "opay", name: "OPay" },
      { id: "palmpay", name: "PalmPay" },
      { id: "momo", name: "MoMo PSB" },
    ],
    banks: ["GTBank", "Access Bank", "Zenith Bank", "First Bank", "UBA"],
  },
  {
    code: "UG",
    name: "Uganda",
    flag: "🇺🇬",
    currency: "UGX",
    dialCode: "+256",
    usdRate: 3750,
    mobileMoney: [
      { id: "mtn", name: "MTN MoMo" },
      { id: "airtel", name: "Airtel Money" },
    ],
    banks: ["Stanbic Bank", "Centenary Bank", "Absa Uganda", "DFCU Bank"],
  },
  {
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    currency: "ZAR",
    dialCode: "+27",
    usdRate: 18,
    mobileMoney: [
      { id: "mtn", name: "MTN MoMo" },
      { id: "vodapay", name: "VodaPay" },
    ],
    banks: ["Capitec", "FNB", "Standard Bank", "Absa", "Nedbank"],
  },
];

export const DEFAULT_COUNTRY_CODE = "KE";

export function getCountry(code: string): AfricaCountry {
  return (
    AFRICA_COUNTRIES.find((c) => c.code === code) ?? AFRICA_COUNTRIES[0]
  );
}

/** Convert a USD-denominated stablecoin amount into the country's local fiat. */
export function toFiat(country: AfricaCountry, usdAmount: number): number {
  return usdAmount * country.usdRate;
}

/** Format a USD amount as a localized fiat string, e.g. "KES 1,234". */
export function formatFiat(country: AfricaCountry, usdAmount: number): string {
  const value = toFiat(country, usdAmount);
  const decimals = value >= 100 ? 0 : 2;
  return `${country.currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
