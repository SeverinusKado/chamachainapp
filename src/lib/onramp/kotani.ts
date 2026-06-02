// Kotani Pay — first real on-ramp integration target (mobile money only).
//
// STATUS: scaffold. Kotani requires server-side API keys and webhook handling,
// so the browser must never call Kotani directly. These methods talk to YOUR
// backend (a thin proxy that holds the secret and forwards to Kotani), whose
// base URL is read from VITE_ONRAMP_API_BASE. Until that env var is set,
// `isConfigured()` returns false and the router transparently falls back to the
// Simulated provider — nothing breaks.
//
// To go live:
//   1. Stand up backend routes: POST /onramp/quote, POST /onramp/initiate,
//      GET /onramp/status/:ref  (these wrap Kotani's API + webhooks).
//   2. Set VITE_ONRAMP_API_BASE to that backend's URL.
//   3. Done — Kenya/Uganda/Ghana/Nigeria mobile-money deposits route here.
//
// Kotani docs: https://docs.kotanipay.com

import type { OnrampProvider, OnrampQuote, OnrampResult } from "./types";

const API_BASE = import.meta.env.VITE_ONRAMP_API_BASE as string | undefined;

// Markets where Kotani supports mobile-money on-ramp that we also list.
const KOTANI_COUNTRIES = ["KE", "UG", "GH", "NG"];

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!API_BASE) throw new Error("Kotani on-ramp backend is not configured");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`On-ramp request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export const kotaniProvider: OnrampProvider = {
  id: "kotani",
  label: "Kotani Pay",
  supports: ["mobile_money"],
  countries: KOTANI_COUNTRIES,
  isConfigured: () => Boolean(API_BASE),
  canHandle({ country, method }) {
    return method === "mobile_money" && KOTANI_COUNTRIES.includes(country.code);
  },
  async quote(req) {
    return post<OnrampQuote>("/onramp/quote", {
      country: req.country.code,
      currency: req.country.currency,
      method: req.method,
      channel: req.channel,
      usdAmount: req.usdAmount,
    });
  },
  async initiate(req) {
    return post<OnrampResult>("/onramp/initiate", {
      country: req.country.code,
      currency: req.country.currency,
      method: req.method,
      channel: req.channel,
      phone: `${req.country.dialCode}${req.destination}`,
      usdAmount: req.usdAmount,
      walletAddress: req.walletAddress,
    });
  },
  async getStatus(reference) {
    if (!API_BASE) throw new Error("Kotani on-ramp backend is not configured");
    const res = await fetch(`${API_BASE}/onramp/status/${reference}`);
    if (!res.ok) throw new Error(`On-ramp status check failed (${res.status})`);
    return res.json() as Promise<OnrampResult>;
  },
};
