// Default on-ramp provider: simulates the full mobile-money / bank flow with no
// network calls. Used everywhere until a real provider is configured, so the
// app and demo work in every supported country out of the box.

import { toFiat } from "@/lib/payments";
import type { OnrampProvider, OnrampQuote, OnrampRequest } from "./types";

function makeQuote(req: OnrampRequest): OnrampQuote {
  return {
    usdAmount: req.usdAmount,
    fiatAmount: toFiat(req.country, req.usdAmount),
    fiatCurrency: req.country.currency,
    rate: req.country.usdRate,
  };
}

export const simulatedProvider: OnrampProvider = {
  id: "simulated",
  label: "Simulated",
  supports: ["mobile_money", "bank"],
  countries: "*",
  isConfigured: () => true,
  canHandle: () => true,
  async quote(req) {
    return makeQuote(req);
  },
  async initiate(req) {
    // Mimic the latency of an STK push / bank handoff.
    await new Promise((r) => setTimeout(r, 2500));
    return {
      reference: `sim_${Date.now().toString(36)}`,
      status: "completed",
      message: `${req.country.currency} ${toFiat(req.country, req.usdAmount).toLocaleString()} simulated via ${req.channel}`,
    };
  },
  async getStatus(reference) {
    return { reference, status: "completed" };
  },
};
