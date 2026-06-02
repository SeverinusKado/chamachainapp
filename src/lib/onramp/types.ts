// Provider-agnostic on-ramp abstraction.
//
// The fiat deposit flow talks to an `OnrampProvider`, never to a specific
// vendor. A router (./router.ts) picks the right provider for a given
// (country, method) pair, falling back to the Simulated provider whenever a
// real provider isn't configured. Going live in a market is therefore additive:
// implement one provider, register it, done — the modal doesn't change.

import type { AfricaCountry } from "@/lib/payments";

export type PaymentMethodKind = "mobile_money" | "bank";

export interface OnrampRequest {
  country: AfricaCountry;
  method: PaymentMethodKind;
  /** Stablecoin (USD) amount the member wants to fund. */
  usdAmount: number;
  /** Mobile-money provider id or bank name selected in the UI. */
  channel: string;
  /** Phone number (mobile money) or account number (bank). */
  destination: string;
  /** Recipient Solana wallet for USDC/USDT settlement, if known. */
  walletAddress?: string;
}

export interface OnrampQuote {
  usdAmount: number;
  fiatAmount: number;
  fiatCurrency: string;
  /** Local currency units per 1 USD used for this quote. */
  rate: number;
  /** Provider fee expressed in fiat, when known. */
  feeFiat?: number;
}

export type OnrampStatus = "pending" | "processing" | "completed" | "failed";

export interface OnrampResult {
  /** Provider-side reference / transaction id. */
  reference: string;
  status: OnrampStatus;
  /** Human-readable detail, shown to the user on failure. */
  message?: string;
}

export interface OnrampProvider {
  /** Stable machine id, e.g. "simulated", "kotani". */
  id: string;
  /** Display label, e.g. "Kotani Pay". */
  label: string;
  /** Payment methods this provider can fulfil. */
  supports: PaymentMethodKind[];
  /** ISO country codes served, or "*" for any. */
  countries: string[] | "*";
  /** True when real credentials/config are present and the provider is usable. */
  isConfigured(): boolean;
  /** Can this provider handle the given request? */
  canHandle(req: Pick<OnrampRequest, "country" | "method">): boolean;
  quote(req: OnrampRequest): Promise<OnrampQuote>;
  initiate(req: OnrampRequest): Promise<OnrampResult>;
  getStatus(reference: string): Promise<OnrampResult>;
}

/** True if `provider` is the local stand-in rather than a real integration. */
export function isSimulated(provider: OnrampProvider): boolean {
  return provider.id === "simulated";
}
