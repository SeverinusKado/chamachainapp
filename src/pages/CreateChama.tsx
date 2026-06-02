import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Plus, Copy, Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { BN } from "@coral-xyz/anchor";
import Layout from "@/components/Layout";
import SignInGate from "@/components/SignInGate";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { isSignableWallet } from "@/lib/program/client";
import { createChama } from "@/lib/program/instructions";

const CreateChama: React.FC = () => {
  const wallet = useWallet();
  const { authenticated } = useAuth();
  const { connection } = useConnection();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [chamaId, setChamaId] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !duration || !maxMembers) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (!isSignableWallet(wallet)) {
      toast({
        title: "Wallet Not Connected",
        description: "Connect a wallet that can sign transactions.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    toast({
      title: "Transaction Pending",
      description: "Creating your chama on Solana devnet...",
    });

    try {
      // Creator-scoped u64 id; lets one wallet run multiple chamas.
      const id = new BN(Date.now());
      const { chama } = await createChama(connection, wallet, {
        id,
        name,
        contributionWhole: Number(amount),
        cycleDurationDays: Number(duration),
        maxMembers: Number(maxMembers),
      });

      setChamaId(chama.toBase58());
      toast({
        title: "Chama Created",
        description: `${name} is live on-chain.`,
      });
      setCreated(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Transaction Failed",
        description: err instanceof Error ? err.message : "Could not create chama.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    const inviteLink = `${window.location.origin}/chama/${chamaId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!authenticated) {
    return <SignInGate action="create a chama" />;
  }

  if (created) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 sm:py-20 max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-2xl p-6 sm:p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-sea-green/15 flex items-center justify-center mx-auto mb-5">
              <Check className="w-8 h-8 text-sea-green" />
            </div>
            <h2 className="text-2xl font-bold text-pale-sky mb-2">Chama Created!</h2>
            <p className="text-cool-steel text-sm mb-6">
              Share the invite link with your members to get started.
            </p>

            <div className="bg-dark-spruce/40 rounded-xl p-4 mb-4">
              <p className="text-xs text-cool-steel mb-1">Chama ID</p>
              <p className="text-sm text-pale-sky font-mono break-all">{chamaId}</p>
            </div>

            <div className="bg-dark-spruce/40 rounded-xl p-4 mb-6">
              <p className="text-xs text-cool-steel mb-1">Invite Link</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-pale-sky font-mono truncate flex-1">
                  {window.location.origin}/chama/{chamaId}
                </p>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-2 rounded-lg bg-primary/15 text-sea-green hover:bg-primary/25 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(`/chama/${chamaId}`)}
                className="flex-1 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all"
              >
                View Chama
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 px-5 py-2.5 rounded-xl bg-surface-elevated text-pale-sky font-semibold text-sm hover:bg-air-force/25 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-lg">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-cool-steel text-sm hover:text-pale-sky transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-pale-sky mb-2">Create a Chama</h1>
          <p className="text-cool-steel text-sm mb-8">Set up a new savings circle for your group.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-pale-sky mb-1.5">Group Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dev Circle"
                className="w-full px-4 py-3 rounded-xl bg-dark-spruce/40 border border-border text-pale-sky placeholder-cool-steel/50 text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40 focus:border-sea-green/40 transition-all"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-pale-sky mb-1.5">
                Contribution Amount (USDC)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10"
                min="1"
                className="w-full px-4 py-3 rounded-xl bg-dark-spruce/40 border border-border text-pale-sky placeholder-cool-steel/50 text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40 focus:border-sea-green/40 transition-all"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-pale-sky mb-1.5">
                Cycle Duration (Days)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="7"
                min="1"
                className="w-full px-4 py-3 rounded-xl bg-dark-spruce/40 border border-border text-pale-sky placeholder-cool-steel/50 text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40 focus:border-sea-green/40 transition-all"
              />
            </div>

            {/* Max Members */}
            <div>
              <label className="block text-sm font-medium text-pale-sky mb-1.5">Max Members</label>
              <input
                type="number"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                placeholder="5"
                min="2"
                max="20"
                className="w-full px-4 py-3 rounded-xl bg-dark-spruce/40 border border-border text-pale-sky placeholder-cool-steel/50 text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40 focus:border-sea-green/40 transition-all"
              />
            </div>

            {/* Summary */}
            {name && amount && duration && maxMembers && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-surface-elevated rounded-xl p-4"
              >
                <p className="text-xs text-cool-steel mb-2 font-medium">Summary</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-cool-steel">
                    <span>Group</span>
                    <span className="text-pale-sky font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between text-cool-steel">
                    <span>Each contributes</span>
                    <span className="text-pale-sky font-medium">{amount} USDC / cycle</span>
                  </div>
                  <div className="flex justify-between text-cool-steel">
                    <span>Cycle</span>
                    <span className="text-pale-sky font-medium">Every {duration} days</span>
                  </div>
                  <div className="flex justify-between text-cool-steel">
                    <span>Max payout per round</span>
                    <span className="text-sea-green font-semibold">
                      {Number(amount) * Number(maxMembers)} USDC
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Chama
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default CreateChama;
