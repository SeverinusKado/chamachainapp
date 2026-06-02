// Routes a fiat deposit to the right on-ramp provider for its (country, method).
//
// Resolution order: the first registered REAL provider that is configured and
// can handle the request wins; otherwise we fall back to the Simulated
// provider. Register new providers here — no other file needs to change.

import type { AfricaCountry } from "@/lib/payments";
import type { OnrampProvider, PaymentMethodKind } from "./types";
import { simulatedProvider } from "./simulated";
import { kotaniProvider } from "./kotani";

// Real providers, in priority order. Simulated is the implicit fallback.
const REAL_PROVIDERS: OnrampProvider[] = [kotaniProvider];

export function resolveProvider(
  country: AfricaCountry,
  method: PaymentMethodKind,
): OnrampProvider {
  const live = REAL_PROVIDERS.find(
    (p) => p.isConfigured() && p.canHandle({ country, method }),
  );
  return live ?? simulatedProvider;
}

export { simulatedProvider, kotaniProvider };
