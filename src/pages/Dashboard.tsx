import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { motion } from "framer-motion";
import { Plus, Users, ArrowRight, Wallet, CircleDollarSign, Clock, Copy, Check, Zap, Coins } from "lucide-react";
import Layout from "@/components/Layout";
import SignInGate from "@/components/SignInGate";
import SkeletonCard from "@/components/SkeletonCard";
import { getTimeUntil } from "@/lib/format";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useChamas } from "@/hooks/useChamaData";
import { useAuth } from "@/lib/auth";
import { isSignableWallet } from "@/lib/program/client";
import { requestTestUsdt, getUsdtBalance } from "@/lib/program/faucet";
import { FAUCET_ENABLED } from "@/lib/program/cluster";
import { useToast } from "@/hooks/use-toast";

const Dashboard: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { authenticated } = useAuth();
  const { chamas, loading } = useChamas();
  const { balance } = useWalletBalance();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [airdropping, setAirdropping] = useState(false);
  const [fauceting, setFauceting] = useState(false);
  const [usdt, setUsdt] = useState<number | null>(null);

  const refreshUsdt = useCallback(async () => {
    if (!publicKey) { setUsdt(null); return; }
    setUsdt(await getUsdtBalance(connection, publicKey));
  }, [connection, publicKey]);

  useEffect(() => { void refreshUsdt(); }, [refreshUsdt]);

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
      await connection.confirmTransaction(sig, "confirmed");
      toast({ title: "Airdrop Received", description: "1 SOL added (devnet)." });
    } catch {
      toast({ title: "Airdrop Failed", description: "Devnet faucet is rate-limited. Try again shortly.", variant: "destructive" });
    }
    setAirdropping(false);
  };

  const handleFaucet = async () => {
    if (!isSignableWallet(wallet) || fauceting) return;
    setFauceting(true);
    try {
      await requestTestUsdt(connection, wallet, 100);
      await refreshUsdt();
      toast({ title: "Test USDT Received", description: "100 mock USDT minted to your wallet." });
    } catch (err) {
      toast({ title: "Faucet Failed", description: err instanceof Error ? err.message : "Could not mint USDT.", variant: "destructive" });
    }
    setFauceting(false);
  };

  const myAddr = publicKey?.toString();
  const userChamas = chamas.filter((c) => !!myAddr && c.members.some((m) => m.owner === myAddr));
  const findMe = (c: (typeof userChamas)[number]) => c.members.find((m) => m.owner === myAddr);

  const stats = {
    totalChamas: userChamas.length,
    totalContributed: userChamas.reduce((s, c) => s + (findMe(c)?.totalContributed || 0), 0),
    pendingPayments: userChamas.filter((c) => c.status === "active" && findMe(c) && !findMe(c)!.paidThisCycle).length,
  };

  if (!authenticated) {
    return <SignInGate action="view your chamas" />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-pale-sky">Dashboard</h1>
            <p className="text-cool-steel text-sm mt-1.5">Manage your savings circles</p>
          </div>
          <Link
            to="/create"
            className="btn-shine inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:glow-strong hover:-translate-y-0.5 transition-all self-start"
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
            className="border-gradient rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 shadow-[var(--shadow-md)]"
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
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="px-3 py-1.5 rounded-lg bg-dark-spruce/50 text-center">
                <p className="text-xs text-cool-steel">SOL</p>
                <p className="text-sm font-bold text-pale-sky">
                  {balance !== null ? balance.toFixed(3) : "—"}
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-dark-spruce/50 text-center">
                <p className="text-xs text-cool-steel">USDT</p>
                <p className="text-sm font-bold text-sea-green">
                  {usdt !== null ? usdt.toFixed(2) : "—"}
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
              {/* Devnet-only dev affordances: SOL airdrop + mock-USDT faucet. */}
              {FAUCET_ENABLED && (
                <>
                  <button
                    onClick={handleAirdrop}
                    disabled={airdropping}
                    title="Request 1 SOL airdrop"
                    className="p-2 rounded-lg bg-dark-spruce/40 text-cool-steel hover:text-pale-sky hover:bg-air-force/15 transition-colors disabled:opacity-40"
                  >
                    <Zap className={`w-4 h-4 ${airdropping ? "animate-pulse text-sea-green" : ""}`} />
                  </button>
                  <button
                    onClick={handleFaucet}
                    disabled={fauceting}
                    title="Get 100 test USDT"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sea-green/15 text-sea-green text-xs font-semibold border border-sea-green/25 hover:bg-sea-green/25 transition-colors disabled:opacity-40"
                  >
                    <Coins className={`w-4 h-4 ${fauceting ? "animate-pulse" : ""}`} />
                    Get USDT
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Active Chamas", value: stats.totalChamas, icon: Users, color: "text-air-force", bg: "bg-air-force/15" },
            { label: "Total Contributed", value: `${stats.totalContributed} USDT`, icon: CircleDollarSign, color: "text-sea-green", bg: "bg-sea-green/15" },
            { label: "Pending Payments", value: stats.pendingPayments, icon: Clock, color: "text-cool-steel", bg: "bg-cool-steel/15" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elite p-5 flex items-center gap-4"
              >
                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-cool-steel">{stat.label}</p>
                  <p className="font-display text-xl font-bold text-pale-sky tnum">{stat.value}</p>
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
        ) : userChamas.length === 0 ? (
          <div className="bg-surface rounded-xl p-10 text-center">
            <Users className="w-10 h-10 text-cool-steel mx-auto mb-3" />
            <p className="text-pale-sky font-medium mb-1">No chamas yet</p>
            <p className="text-cool-steel text-sm mb-5">Create one or join via an invite link to get started.</p>
            <Link to="/create" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all">
              <Plus className="w-4 h-4" />
              Create Chama
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {userChamas.map((chama, i) => {
              const paid = chama.contributionsThisCycle;
              return (
                <motion.div
                  key={chama.address}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={`/chama/${chama.address}`}
                    className="card-elite block p-5 group h-full"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-semibold text-pale-sky group-hover:text-sea-green transition-colors">
                        {chama.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${chama.status === "active" ? "bg-sea-green/15 text-sea-green" : "bg-cool-steel/15 text-cool-steel"}`}>
                        {chama.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-cool-steel">
                        <span>Members</span>
                        <span className="text-pale-sky font-medium">{chama.memberCount}/{chama.maxMembers}</span>
                      </div>
                      <div className="flex justify-between text-cool-steel">
                        <span>Round</span>
                        <span className="text-pale-sky font-medium">{chama.currentCycle}/{chama.maxMembers}</span>
                      </div>
                      <div className="flex justify-between text-cool-steel">
                        <span>Contribution</span>
                        <span className="text-pale-sky font-medium">{chama.contributionAmount} USDT</span>
                      </div>
                      <div className="flex justify-between text-cool-steel">
                        <span>Next Payout</span>
                        <span className="text-pale-sky font-medium">{getTimeUntil(new Date(chama.cycleDeadline * 1000).toISOString())}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-cool-steel mb-1.5">
                        <span>Cycle Progress</span>
                        <span>{paid}/{chama.memberCount} paid</span>
                      </div>
                      <div className="h-2 bg-dark-spruce/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sea-green rounded-full transition-all duration-500"
                          style={{ width: `${chama.memberCount ? (paid / chama.memberCount) * 100 : 0}%` }}
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
