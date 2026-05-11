import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Check, AlertCircle } from "lucide-react";

interface MpesaModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
}

const MpesaModal: React.FC<MpesaModalProps> = ({ open, onClose, amount }) => {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"input" | "processing" | "success">("input");

  const handleSubmit = async () => {
    if (!phone) return;
    setStep("processing");
    await new Promise((r) => setTimeout(r, 2500));
    setStep("success");
  };

  const handleClose = () => {
    setStep("input");
    setPhone("");
    onClose();
  };

  const kesEquivalent = (amount * 154).toLocaleString();

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
            className="relative bg-surface-elevated rounded-2xl w-full max-w-sm p-6 z-10"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-cool-steel hover:text-pale-sky hover:bg-air-force/15 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Simulated badge */}
            <div className="flex items-center gap-1.5 mb-5">
              <AlertCircle className="w-3.5 h-3.5 text-cool-steel" />
              <span className="text-xs text-cool-steel font-medium">Simulated - Coming Soon</span>
            </div>

            {step === "input" && (
              <>
                <div className="w-12 h-12 rounded-xl bg-sea-green/15 flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-sea-green" />
                </div>
                <h3 className="text-lg font-bold text-pale-sky mb-1">Pay via M-Pesa</h3>
                <p className="text-sm text-cool-steel mb-5">
                  Send KES {kesEquivalent} (equivalent to {amount} USDC)
                </p>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-cool-steel mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full px-4 py-3 rounded-xl bg-input border border-cool-steel/30 text-pale-sky placeholder-cool-steel/40 text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40 focus:border-sea-green/50 transition-all"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!phone}
                  className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all disabled:opacity-50"
                >
                  Send Payment Request
                </button>
              </>
            )}

            {step === "processing" && (
              <div className="text-center py-6">
                <div className="w-12 h-12 border-2 border-sea-green/25 border-t-sea-green rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-pale-sky mb-1">Processing...</h3>
                <p className="text-sm text-cool-steel">
                  Sending STK push to {phone}
                </p>
                <p className="text-xs text-cool-steel mt-2">KES {kesEquivalent}</p>
              </div>
            )}

            {step === "success" && (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-sea-green/15 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-sea-green" />
                </div>
                <h3 className="text-lg font-bold text-pale-sky mb-1">Payment Simulated!</h3>
                <p className="text-sm text-cool-steel mb-5">
                  KES {kesEquivalent} would be deducted from {phone}
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

export default MpesaModal;
