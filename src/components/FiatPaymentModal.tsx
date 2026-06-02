import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Building2, Check, AlertCircle, ChevronDown } from "lucide-react";
import {
  AFRICA_COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  getCountry,
  formatFiat,
} from "@/lib/payments";
import { resolveProvider } from "@/lib/onramp/router";
import { isSimulated, type PaymentMethodKind } from "@/lib/onramp/types";

interface FiatPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number; // USDC/USDT amount
  /** Recipient Solana wallet for stablecoin settlement, if connected. */
  walletAddress?: string;
}

type Step = "input" | "processing" | "success";

const FiatPaymentModal: React.FC<FiatPaymentModalProps> = ({ open, onClose, amount, walletAddress }) => {
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [method, setMethod] = useState<PaymentMethodKind>("mobile_money");
  const [provider, setProvider] = useState("");
  const [bank, setBank] = useState("");
  const [phone, setPhone] = useState("");
  const [account, setAccount] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState<string | null>(null);

  const country = useMemo(() => getCountry(countryCode), [countryCode]);
  const fiat = formatFiat(country, amount);

  // Which on-ramp will actually fulfil this (country, method); falls back to
  // the Simulated provider until a real one is configured.
  const onramp = useMemo(() => resolveProvider(country, method), [country, method]);
  const live = !isSimulated(onramp);

  // Selected provider/bank fall back to the first available for the country.
  const activeProvider = provider || country.mobileMoney[0]?.id || "";
  const activeBank = bank || country.banks[0] || "";
  const providerName =
    country.mobileMoney.find((p) => p.id === activeProvider)?.name ?? "Mobile Money";

  const destination = method === "mobile_money" ? phone : account;
  const canSubmit = destination.trim().length > 0;

  const reset = () => {
    setStep("input");
    setProvider("");
    setBank("");
    setPhone("");
    setAccount("");
    setError(null);
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    // reset method-specific selections so we don't carry a provider that
    // doesn't exist in the newly selected country
    setProvider("");
    setBank("");
    setPhone("");
    setAccount("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setStep("processing");
    try {
      const result = await onramp.initiate({
        country,
        method,
        usdAmount: amount,
        channel: method === "mobile_money" ? providerName : activeBank,
        destination,
        walletAddress,
      });
      if (result.status === "failed") {
        setError(result.message ?? "Payment could not be completed. Please try again.");
        setStep("input");
        return;
      }
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStep("input");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const methodLabel = method === "mobile_money" ? providerName : activeBank;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-dark-spruce/80 backdrop-blur-sm" onClick={handleClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface-elevated rounded-2xl w-full max-w-sm p-6 z-10 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-cool-steel hover:text-pale-sky hover:bg-air-force/15 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Provider badge: real integration vs simulated fallback */}
            <div className="flex items-center gap-1.5 mb-5">
              {live ? (
                <>
                  <Check className="w-3.5 h-3.5 text-sea-green" />
                  <span className="text-xs text-sea-green font-medium">Powered by {onramp.label}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-cool-steel" />
                  <span className="text-xs text-cool-steel font-medium">Simulated - Coming Soon</span>
                </>
              )}
            </div>

            {step === "input" && (
              <>
                <h3 className="text-lg font-bold text-pale-sky mb-1">Pay with local currency</h3>
                <p className="text-sm text-cool-steel mb-5">
                  {fiat} <span className="text-cool-steel/70">(≈ {amount} USDC)</span>
                </p>

                {/* Country selector */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-cool-steel mb-1.5">Country</label>
                  <div className="relative">
                    <select
                      value={countryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full appearance-none px-4 py-3 pr-9 rounded-xl bg-input border border-cool-steel/30 text-pale-sky text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40 focus:border-sea-green/50 transition-all"
                    >
                      {AFRICA_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-surface-elevated text-pale-sky">
                          {c.flag} {c.name} ({c.currency})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-cool-steel absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Method tabs */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => setMethod("mobile_money")}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      method === "mobile_money"
                        ? "bg-sea-green/15 border-sea-green/50 text-pale-sky"
                        : "bg-input border-cool-steel/30 text-cool-steel hover:text-pale-sky"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Mobile Money
                  </button>
                  <button
                    onClick={() => setMethod("bank")}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      method === "bank"
                        ? "bg-sea-green/15 border-sea-green/50 text-pale-sky"
                        : "bg-input border-cool-steel/30 text-cool-steel hover:text-pale-sky"
                    }`}
                  >
                    <Building2 className="w-4 h-4" /> Bank
                  </button>
                </div>

                {method === "mobile_money" ? (
                  <>
                    {/* Provider */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-cool-steel mb-1.5">Provider</label>
                      <div className="relative">
                        <select
                          value={activeProvider}
                          onChange={(e) => setProvider(e.target.value)}
                          className="w-full appearance-none px-4 py-3 pr-9 rounded-xl bg-input border border-cool-steel/30 text-pale-sky text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40 focus:border-sea-green/50 transition-all"
                        >
                          {country.mobileMoney.map((p) => (
                            <option key={p.id} value={p.id} className="bg-surface-elevated text-pale-sky">
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-cool-steel absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-cool-steel mb-1.5">Phone Number</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl bg-input border border-r-0 border-cool-steel/30 text-cool-steel text-sm">
                          {country.dialCode}
                        </span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="7XX XXX XXX"
                          className="flex-1 px-4 py-3 rounded-r-xl bg-input border border-cool-steel/30 text-pale-sky placeholder-cool-steel/40 text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40 focus:border-sea-green/50 transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Bank */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-cool-steel mb-1.5">Bank</label>
                      <div className="relative">
                        <select
                          value={activeBank}
                          onChange={(e) => setBank(e.target.value)}
                          className="w-full appearance-none px-4 py-3 pr-9 rounded-xl bg-input border border-cool-steel/30 text-pale-sky text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40 focus:border-sea-green/50 transition-all"
                        >
                          {country.banks.map((b) => (
                            <option key={b} value={b} className="bg-surface-elevated text-pale-sky">
                              {b}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-cool-steel absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Account */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-cool-steel mb-1.5">Account Number</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        placeholder="0000 0000 0000"
                        className="w-full px-4 py-3 rounded-xl bg-input border border-cool-steel/30 text-pale-sky placeholder-cool-steel/40 text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40 focus:border-sea-green/50 transition-all"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="flex items-start gap-1.5 mb-3 text-xs text-destructive">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all disabled:opacity-50"
                >
                  Pay {fiat}
                </button>
              </>
            )}

            {step === "processing" && (
              <div className="text-center py-6">
                <div className="w-12 h-12 border-2 border-sea-green/25 border-t-sea-green rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-pale-sky mb-1">Processing...</h3>
                <p className="text-sm text-cool-steel">
                  {method === "mobile_money"
                    ? `Sending ${providerName} request to ${country.dialCode} ${phone}`
                    : `Initiating ${activeBank} transfer`}
                </p>
                <p className="text-xs text-cool-steel mt-2">{fiat}</p>
              </div>
            )}

            {step === "success" && (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-sea-green/15 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-sea-green" />
                </div>
                <h3 className="text-lg font-bold text-pale-sky mb-1">Payment Simulated!</h3>
                <p className="text-sm text-cool-steel mb-5">
                  {fiat} would be collected via {methodLabel} ({country.name})
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl border border-cool-steel/30 text-cool-steel font-medium text-sm hover:border-sea-green/50 hover:text-pale-sky transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FiatPaymentModal;
