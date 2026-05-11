import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Wallet,
  Users,
  CircleDollarSign,
  Clock,
  Check,
  AlertTriangle,
  ArrowDownRight,
  ExternalLink,
  Phone,
  Shield,
} from "lucide-react";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import SkeletonCard from "@/components/SkeletonCard";
import MpesaModal from "@/components/MpesaModal";
import { USER_WALLET, getTimeUntil, formatDate, type Chama } from "@/lib/mock-data";
import { useChamaStore } from "@/lib/chama-store";
import { transferSOL, vaultTransfer, explorerUrl, LAMPORTS_PER_USDC } from "@/lib/solana";
import { useToast } from "@/hooks/use-toast";

const ChamaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { chamas, getVaultKeypair, updateChama } = useChamaStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contributing, setContributing] = useState(false);
  const [triggeringPayout, setTriggeringPayout] = useState(false);
  const [mpesaOpen, setMpesaOpen] = useState(false);
  const [chama, setChama] = useState<Chama | null>(null);
  const loadedIdRef = useRef<string | undefined>(undefined);

  const isMe = (wallet: string) =>
    wallet === USER_WALLET || (!!publicKey && wallet === publicKey.toString());

  useEffect(() => {
    const isNewId = id !== loadedIdRef.current;
    if (isNewId) { setLoading(true); loadedIdRef.current = id; }
    const found = chamas.find((c) => c.id === id) ?? null;
    setChama(found);
    if (isNewId) {
      const timer = setTimeout(() => setLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [id, chamas]);

  const applyContribution = (prev: Chama): Chama => ({
    ...prev,
    vaultBalance: prev.vaultBalance + prev.contributionAmount,
    members: prev.members.map((m) =>
      isMe(m.wallet)
        ? { ...m, statusThisCycle: "paid" as const, totalContributed: m.totalContributed + prev.contributionAmount }
        : m
    ),
  });

  const applyPayout = (prev: Chama): Chama => ({
    ...prev,
    currentRound: prev.currentRound + 1,
    vaultBalance: 0,
    rounds: prev.rounds.map((r) =>
      r.status === "current"
        ? { ...r, status: "completed" as const, paidAt: new Date().toISOString(), amount: prev.vaultBalance }
        : r.roundNumber === prev.currentRound + 1
        ? { ...r, status: "current" as const }
        : r
    ),
    members: prev.members.map((m) => ({ ...m, statusThisCycle: "pending" as const })),
  });

  const handleContribute = async () => {
    if (!chama || !publicKey) return;
    setContributing(true);

    const vaultKeypair = getVaultKeypair(chama.id);

    if (vaultKeypair) {
      // ── Real on-chain contribution ────────────────────────────
      toast({ title: "Awaiting Approval", description: "Approve the transaction in your wallet." });
      try {
        const lamports = Math.round(chama.contributionAmount * LAMPORTS_PER_USDC);
        const sig = await transferSOL(connection, publicKey, vaultKeypair.publicKey, lamports, sendTransaction);
        setChama((prev) => prev ? applyContribution(prev) : prev);
        updateChama(chama.id, applyContribution);
        toast({
          title: "Contribution Confirmed ✓",
          description: `${chama.contributionAmount} USDC sent · ${explorerUrl(sig).split('/tx/')[1].slice(0, 8)}… View on Explorer`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast({ title: "Transaction Failed", description: msg, variant: "destructive" });
      }
    } else {
      // ── Simulation for mock chamas ────────────────────────────
      toast({ title: "Transaction Pending", description: "Sending contribution to vault..." });
      await new Promise((r) => setTimeout(r, 2000));
      setChama((prev) => prev ? applyContribution(prev) : prev);
      toast({ title: "Contribution Confirmed", description: `${chama.contributionAmount} USDC sent to vault.` });
    }

    setContributing(false);
  };

  const handleTriggerPayout = async () => {
    if (!chama) return;
    setTriggeringPayout(true);

    const currentRound = chama.rounds.find((r) => r.status === "current");
    const vaultKeypair = getVaultKeypair(chama.id);

    if (vaultKeypair && currentRound) {
      // ── Real on-chain payout ──────────────────────────────────
      let recipientPubkey: PublicKey | null = null;
      try { recipientPubkey = new PublicKey(currentRound.recipientWallet); } catch { /* invalid address */ }

      if (!recipientPubkey) {
        toast({ title: "Cannot Payout", description: "Recipient wallet address is invalid or not set.", variant: "destructive" });
        setTriggeringPayout(false);
        return;
      }

      toast({ title: "Triggering Payout", description: "Sending funds from vault to recipient..." });
      try {
        const vaultLamports = await connection.getBalance(vaultKeypair.publicKey);
        const fee = 5_000; // reserve for tx fee
        if (vaultLamports <= fee) {
          toast({ title: "Insufficient Vault Balance", description: "Not enough SOL in the vault to pay out.", variant: "destructive" });
          setTriggeringPayout(false);
          return;
        }
        const sig = await vaultTransfer(connection, vaultKeypair, recipientPubkey, vaultLamports - fee);
        setChama((prev) => prev ? applyPayout(prev) : prev);
        updateChama(chama.id, applyPayout);
        toast({
          title: "Payout Sent ✓",
          description: `Funds sent to ${currentRound.recipientWallet.slice(0, 8)}… · View on Explorer`,
        });
        console.info("Payout tx:", explorerUrl(sig));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast({ title: "Payout Failed", description: msg, variant: "destructive" });
      }
    } else {
      // ── Simulation for mock chamas ────────────────────────────
      toast({ title: "Transaction Pending", description: "Triggering payout..." });
      await new Promise((r) => setTimeout(r, 2500));
      setChama((prev) => prev ? applyPayout(prev) : prev);
      toast({ title: "Payout Sent", description: `Funds sent to ${currentRound?.recipientWallet || "recipient"}.` });
    }

    setTriggeringPayout(false);
  };

  if (!connected) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Wallet className="w-12 h-12 text-cool-steel mx-auto mb-4" />
          <h2 className="text-xl font-bold text-pale-sky mb-2">Wallet Not Connected</h2>
          <p className="text-cool-steel text-sm">Connect your wallet to view chama details.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <SkeletonCard />
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </Layout>
    );
  }

  if (!chama) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-pale-sky mb-2">Chama Not Found</h2>
          <p className="text-cool-steel text-sm mb-6">This chama doesn't exist or may have been removed.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const userMember = chama.members.find((m) => isMe(m.wallet));
  const paidCount = chama.members.filter((m) => m.statusThisCycle === "paid").length;
  const currentRoundData = chama.rounds.find((r) => r.status === "current");
  const allPaid = paidCount === chama.members.length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-cool-steel text-sm hover:text-pale-sky transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Overview Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl p-5 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-pale-sky">{chama.name}</h1>
              <p className="text-sm text-cool-steel mt-0.5">
                Created {formatDate(chama.createdAt)} by {chama.creator}
              </p>
            </div>
            {userMember && <StatusBadge status={userMember.statusThisCycle} />}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Vault Balance",
                value: `${chama.vaultBalance.toFixed(1)} USDC`,
                icon: CircleDollarSign,
                color: "text-sea-green",
                bg: "bg-sea-green/15",
              },
              {
                label: "Current Round",
                value: `${chama.currentRound} / ${chama.totalRounds}`,
                icon: ArrowDownRight,
                color: "text-air-force",
                bg: "bg-air-force/15",
              },
              {
                label: "Members",
                value: `${chama.members.length} / ${chama.maxMembers}`,
                icon: Users,
                color: "text-pale-sky",
                bg: "bg-pale-sky/10",
              },
              {
                label: "Next Payout",
                value: getTimeUntil(chama.nextPayoutDate),
                icon: Clock,
                color: "text-cool-steel",
                bg: "bg-cool-steel/15",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-dark-spruce/30 rounded-xl p-3.5">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-xs text-cool-steel">{stat.label}</p>
                  <p className="text-sm font-bold text-pale-sky mt-0.5">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Members List */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface rounded-2xl p-5 sm:p-6"
            >
              <h2 className="text-base font-semibold text-pale-sky mb-4">Members</h2>
              <div className="space-y-2">
                {chama.members.map((member) => {
                  const isPayoutTurn =
                    currentRoundData?.recipientWallet === member.wallet;
                  return (
                    <div
                      key={member.wallet}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        isPayoutTurn
                          ? "bg-sea-green/10 border border-sea-green/25 animate-glow-pulse"
                          : "bg-dark-spruce/25"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isPayoutTurn ? "bg-sea-green/20" : "bg-air-force/15"
                          }`}
                        >
                          <Wallet
                            className={`w-4 h-4 ${isPayoutTurn ? "text-sea-green" : "text-air-force"}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-pale-sky font-mono truncate">
                              {member.wallet}
                            </span>
                            {isPayoutTurn && (
                              <span className="text-xs bg-sea-green/20 text-sea-green px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                Payout Turn
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Shield className="w-3 h-3 text-cool-steel" />
                            <span className="text-xs text-cool-steel">
                              Rep: {member.reputationScore}
                            </span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={member.statusThisCycle} size="sm" />
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Contribution Progress */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface rounded-2xl p-5 sm:p-6"
            >
              <h2 className="text-base font-semibold text-pale-sky mb-4">Contribution Progress</h2>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-cool-steel">
                  {paidCount} of {chama.members.length} members paid
                </span>
                <span className="text-pale-sky font-semibold">
                  {Math.round((paidCount / chama.members.length) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-dark-spruce/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(paidCount / chama.members.length) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-sea-green rounded-full"
                />
              </div>
              <div className="flex gap-3 mt-4 text-xs text-cool-steel">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sea-green" />
                  Paid: {paidCount}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cool-steel" />
                  Pending: {chama.members.filter((m) => m.statusThisCycle === "pending").length}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Defaulted: {chama.members.filter((m) => m.statusThisCycle === "defaulted").length}
                </span>
              </div>
            </motion.div>

            {/* Payout Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface rounded-2xl p-5 sm:p-6"
            >
              <h2 className="text-base font-semibold text-pale-sky mb-4">Payout Schedule</h2>
              <div className="space-y-2">
                {chama.rounds.map((round) => (
                  <div
                    key={round.roundNumber}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      round.status === "current"
                        ? "bg-sea-green/8 border border-sea-green/20"
                        : round.status === "completed"
                        ? "bg-dark-spruce/20"
                        : "bg-dark-spruce/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          round.status === "completed"
                            ? "bg-sea-green/15 text-sea-green"
                            : round.status === "current"
                            ? "bg-cool-steel/15 text-cool-steel"
                            : "bg-air-force/10 text-cool-steel"
                        }`}
                      >
                        {round.status === "completed" ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          `R${round.roundNumber}`
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-pale-sky font-medium">
                          Round {round.roundNumber}
                        </p>
                        <p className="text-xs text-cool-steel font-mono">
                          {round.recipientWallet}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {round.status === "completed" ? (
                        <>
                          <p className="text-xs text-sea-green font-medium">
                            {round.amount} USDC
                          </p>
                          <p className="text-xs text-cool-steel">{formatDate(round.paidAt!)}</p>
                        </>
                      ) : round.status === "current" ? (
                        <span className="text-xs bg-cool-steel/15 text-cool-steel px-2 py-0.5 rounded-full font-medium">
                          In Progress
                        </span>
                      ) : (
                        <span className="text-xs text-cool-steel">Upcoming</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-surface rounded-2xl p-5 sm:p-6"
            >
              <h2 className="text-base font-semibold text-pale-sky mb-4">Actions</h2>
              <div className="space-y-3">
                {/* Pay Contribution */}
                <button
                  onClick={handleContribute}
                  disabled={contributing || userMember?.statusThisCycle === "paid"}
                  className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {contributing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : userMember?.statusThisCycle === "paid" ? (
                    <>
                      <Check className="w-4 h-4" />
                      Contribution Paid
                    </>
                  ) : (
                    <>
                      <CircleDollarSign className="w-4 h-4" />
                      Pay {chama.contributionAmount} USDC
                    </>
                  )}
                </button>

                {/* Trigger Payout */}
                <button
                  onClick={handleTriggerPayout}
                  disabled={triggeringPayout || !allPaid}
                  className="w-full px-4 py-3 rounded-xl bg-air-force/15 text-air-force font-semibold text-sm border border-air-force/25 hover:bg-air-force/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {triggeringPayout ? (
                    <>
                      <div className="w-4 h-4 border-2 border-air-force/30 border-t-air-force rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4" />
                      Trigger Payout
                    </>
                  )}
                </button>
                {!allPaid && (
                  <p className="text-xs text-cool-steel text-center flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-cool-steel" />
                    All members must pay before payout
                  </p>
                )}

                {/* M-Pesa Simulated */}
                <div className="border-t border-border pt-3 mt-1">
                  <button
                    onClick={() => setMpesaOpen(true)}
                    className="w-full px-4 py-3 rounded-xl bg-dark-spruce/40 text-cool-steel font-medium text-sm border border-border hover:bg-dark-spruce/60 hover:text-pale-sky transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Pay via M-Pesa
                    <span className="text-xs text-cool-steel/70 ml-1">(Simulated)</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Your Stats */}
            {userMember && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-surface rounded-2xl p-5 sm:p-6"
              >
                <h2 className="text-base font-semibold text-pale-sky mb-4">Your Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-cool-steel">Total Contributed</span>
                    <span className="text-pale-sky font-medium">{userMember.totalContributed} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cool-steel">Cycles Completed</span>
                    <span className="text-pale-sky font-medium">{userMember.cyclesCompleted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cool-steel">Defaults</span>
                    <span
                      className={`font-medium ${
                        userMember.defaults > 0 ? "text-destructive" : "text-sea-green"
                      }`}
                    >
                      {userMember.defaults}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cool-steel">Reputation</span>
                    <span className="text-pale-sky font-bold">{userMember.reputationScore}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-surface rounded-2xl p-5 sm:p-6"
            >
              <h2 className="text-base font-semibold text-pale-sky mb-3">Explorer</h2>
              <a
                href="https://explorer.solana.com/?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-air-force hover:text-pale-sky transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View on Solana Explorer
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      <MpesaModal open={mpesaOpen} onClose={() => setMpesaOpen(false)} amount={chama.contributionAmount} />
    </Layout>
  );
};

export default ChamaDetail;
