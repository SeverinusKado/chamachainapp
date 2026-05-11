import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { motion } from "framer-motion";
import { Plus, Users, ArrowRight, Wallet, CircleDollarSign, Clock, Copy, Check, Zap } from "lucide-react";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import SkeletonCard from "@/components/SkeletonCard";
import { USER_WALLET, getTimeUntil } from "@/lib/mock-data";
import { useChamaStore } from "@/lib/chama-store";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { shortenAddress } from "@/lib/solana";

const Dashboard: React.FC = () => {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const { chamas } = useChamaStore();
  const { balance } = useWalletBalance();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [airdropping, setAirdropping] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAirdrop = async () => {
    if (!publicKey || airdropping) return;
    setAirdropping(true);
    try {
      const sig = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
    } catch { /* rate-limited or already rich */ }
    setAirdropping(false);
  };

  const connectedWallet = publicKey?.toString();
  const userChamas = chamas.filter((c) =>
    c.members.some(
      (m) => m.wallet === USER_WALLET || (connectedWallet && m.wallet === connectedWallet)
    )
  );

  const findMe = (members: typeof userChamas[0]["members"]) =>
    members.find(
      (m) => m.wallet === USER_WALLET || (connectedWallet && m.wallet === connectedWallet)
    );

  const stats = {
    totalChamas: userChamas.length,
    totalContributed: userChamas.reduce((sum, c) => {
      return sum + (findMe(c.members)?.totalContributed || 0);
    }, 0),
    pendingPayments: userChamas.filter((c) => findMe(c.members)?.statusThisCycle === "pending").length,
  };

  if (!connected) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Wallet className="w-12 h-12 text-cool-steel mx-auto mb-4" />
          <h2 className="text-xl font-bold text-pale-sky mb-2">Wallet Not Connected</h2>
          <p className="text-cool-steel text-sm">Connect your wallet to view your chamas.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-pale-sky">Dashboard</h1>
            <p className="text-cool-steel text-sm mt-1">Manage your savings circles</p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            New Chama
          </Link>
        </div>

        {/* Wallet Info */}
        {publicKey && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-lg bg-sea-green/15 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-sea-green" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-cool-steel mb-0.5">Connected Wallet</p>
                <p className="text-sm font-mono text-pale-sky truncate">{publicKey.toString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-lg bg-dark-spruce/50 text-center">
                <p className="text-xs text-cool-steel">Balance</p>
                <p className="text-sm font-bold text-pale-sky">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : "—"}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-sea-green/10 text-sea-green border border-sea-green/20 font-medium">
                Devnet
              </span>
              <button
                onClick={handleCopy}
                title="Copy address"
                className="p-2 rounded-lg bg-dark-spruce/40 text-cool-steel hover:text-pale-sky hover:bg-air-force/15 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-sea-green" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleAirdrop}
                disabled={airdropping}
                title="Request 1 SOL airdrop"
                className="p-2 rounded-lg bg-dark-spruce/40 text-cool-steel hover:text-pale-sky hover:bg-air-force/15 transition-colors disabled:opacity-40"
              >
                <Zap className={`w-4 h-4 ${airdropping ? "animate-pulse text-sea-green" : ""}`} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Active Chamas",
              value: stats.totalChamas,
              icon: Users,
              color: "text-air-force",
              bg: "bg-air-force/15",
            },
            {
              label: "Total Contributed",
              value: `${stats.totalContributed} USDC`,
              icon: CircleDollarSign,
              color: "text-sea-green",
              bg: "bg-sea-green/15",
            },
            {
              label: "Pending Payments",
              value: stats.pendingPayments,
              icon: Clock,
              color: "text-cool-steel",
              bg: "bg-cool-steel/15",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface rounded-xl p-5 flex items-center gap-4"
              >
                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-cool-steel">{stat.label}</p>
                  <p className="text-lg font-bold text-pale-sky">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Chama Cards */}
        <h2 className="text-lg font-semibold text-pale-sky mb-4">Your Chamas</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {userChamas.map((chama, i) => {
              const userMember = findMe(chama.members);
              return (
                <motion.div
                  key={chama.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={`/chama/${chama.id}`}
                    className="block bg-surface rounded-xl p-5 hover:bg-surface-elevated transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-semibold text-pale-sky group-hover:text-sea-green transition-colors">
                        {chama.name}
                      </h3>
                      {userMember && <StatusBadge status={userMember.statusThisCycle} size="sm" />}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-cool-steel">
                        <span>Members</span>
                        <span className="text-pale-sky font-medium">
                          {chama.members.length}/{chama.maxMembers}
                        </span>
                      </div>
                      <div className="flex justify-between text-cool-steel">
                        <span>Round</span>
                        <span className="text-pale-sky font-medium">
                          {chama.currentRound}/{chama.totalRounds}
                        </span>
                      </div>
                      <div className="flex justify-between text-cool-steel">
                        <span>Contribution</span>
                        <span className="text-pale-sky font-medium">{chama.contributionAmount} USDC</span>
                      </div>
                      <div className="flex justify-between text-cool-steel">
                        <span>Next Payout</span>
                        <span className="text-pale-sky font-medium">{getTimeUntil(chama.nextPayoutDate)}</span>
                      </div>
                    </div>

                    {/* Contribution Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-cool-steel mb-1.5">
                        <span>Cycle Progress</span>
                        <span>
                          {chama.members.filter((m) => m.statusThisCycle === "paid").length}/
                          {chama.members.length} paid
                        </span>
                      </div>
                      <div className="h-2 bg-dark-spruce/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sea-green rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              (chama.members.filter((m) => m.statusThisCycle === "paid").length /
                                chama.members.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center text-xs text-sea-green font-medium group-hover:gap-2 transition-all">
                      View Details
                      <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
