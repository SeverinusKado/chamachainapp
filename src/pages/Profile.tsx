import React from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import {
  Shield, Award, TrendingUp, TrendingDown, CircleDollarSign,
  Users, Star, HandCoins, Check, X, Copy,
} from "lucide-react";
import Layout from "@/components/Layout";
import SignInGate from "@/components/SignInGate";
import SkeletonCard from "@/components/SkeletonCard";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useChamas, useReputation } from "@/hooks/useChamaData";
import { useAuth } from "@/lib/auth";

const ReputationGauge: React.FC<{ score: number }> = ({ score }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  // Reputation tiers map to brand tokens: green (strong) → gold (fair) → red (weak).
  const colorVar = score >= 80 ? "var(--primary)" : score >= 50 ? "var(--accent)" : "var(--destructive)";

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} style={{ stroke: "rgb(var(--muted))" }} strokeWidth="10" fill="none" />
        <motion.circle
          cx="80" cy="80" r={radius} style={{ stroke: `rgb(${colorVar})` }} strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-3xl font-bold text-pale-sky" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {score}
        </motion.span>
        <span className="text-xs text-cool-steel">/ 100</span>
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const { publicKey } = useWallet();
  const { authenticated } = useAuth();
  const { balance } = useWalletBalance();
  const { reputation, loading: repLoading, error: repError, refresh: refreshRep } = useReputation(publicKey);
  const { chamas, loading: chamasLoading } = useChamas();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!authenticated) {
    return <SignInGate action="view your profile" />;
  }

  if (repLoading || chamasLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <SkeletonCard />
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </Layout>
    );
  }

  const myAddr = publicKey?.toString();
  const myChamas = chamas.filter((c) => !!myAddr && c.members.some((m) => m.owner === myAddr));
  const myMember = (addr: string) => {
    const c = chamas.find((x) => x.address === addr);
    return c?.members.find((m) => m.owner === myAddr);
  };

  const score = reputation?.score ?? 50;
  const onTime = reputation?.onTimeContributions ?? 0;
  const loansRepaid = reputation?.loansRepaid ?? 0;
  const defaults = (reputation?.contributionDefaults ?? 0) + (reputation?.loansDefaulted ?? 0);
  const chamasJoined = myChamas.length;
  const chamasCreated = chamas.filter((c) => c.creator === myAddr).length;
  const totalContributed = myChamas.reduce((s, c) => s + (c.members.find((m) => m.owner === myAddr)?.totalContributed || 0), 0);

  const badges = [
    { name: "Circle Creator", description: "Created a chama", icon: Users, earned: chamasCreated > 0 },
    { name: "Reliable Member", description: "No defaults, contributing", icon: Shield, earned: defaults === 0 && onTime > 0 },
    { name: "Circle Veteran", description: "5+ on-time contributions", icon: Star, earned: onTime >= 5 },
    { name: "Trusted Borrower", description: "Repaid a loan", icon: HandCoins, earned: loansRepaid > 0 },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-pale-sky mb-2">Reputation Profile</h1>
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <p className="text-sm text-cool-steel font-mono break-all">{publicKey?.toString()}</p>
            {publicKey && (
              <button onClick={handleCopy} className="p-1 rounded text-cool-steel hover:text-pale-sky transition-colors shrink-0">
                {copied ? <Check className="w-3.5 h-3.5 text-sea-green" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
            {balance !== null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-sea-green/10 border border-sea-green/20 text-sea-green font-medium">
                {balance.toFixed(4)} SOL · Devnet
              </span>
            )}
          </div>
        </motion.div>

        {repError && (
          <div className="bg-surface rounded-xl p-4 mb-6 text-sm text-cool-steel flex items-center justify-between gap-3">
            <span>Couldn't load your on-chain reputation. The network request failed.</span>
            <button onClick={() => void refreshRep()} className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:brightness-110 transition-all">
              Retry
            </button>
          </div>
        )}

        {!repError && !reputation && (
          <div className="bg-surface rounded-xl p-4 mb-6 text-sm text-cool-steel">
            No on-chain reputation yet. It's created automatically the first time you create or join a chama. Showing the starting score of 50.
          </div>
        )}

        {/* Gauge + Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface rounded-2xl p-6 sm:p-8 mb-6">
          <ReputationGauge score={score} />
          <p className="text-center text-sm text-cool-steel mt-3">Reputation Score</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Contributed", value: `${totalContributed} USDT`, icon: CircleDollarSign, color: "text-sea-green" },
              { label: "On-time", value: onTime, icon: TrendingUp, color: "text-air-force" },
              { label: "Defaults", value: defaults, icon: TrendingDown, color: defaults > 0 ? "text-destructive" : "text-sea-green" },
              { label: "Chamas", value: chamasJoined, icon: Users, color: "text-pale-sky" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-dark-spruce/30 rounded-xl p-3 text-center">
                  <Icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                  <p className="text-lg font-bold text-pale-sky">{stat.value}</p>
                  <p className="text-xs text-cool-steel">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Badges */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface rounded-2xl p-5 sm:p-6">
            <h2 className="text-base font-semibold text-pale-sky mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-sea-green" /> Badges
            </h2>
            <div className="space-y-3">
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.name} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${badge.earned ? "bg-sea-green/8 border border-sea-green/20" : "bg-dark-spruce/20 opacity-50"}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${badge.earned ? "bg-sea-green/15" : "bg-air-force/10"}`}>
                      <Icon className={`w-4 h-4 ${badge.earned ? "text-sea-green" : "text-cool-steel"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${badge.earned ? "text-pale-sky" : "text-cool-steel"}`}>{badge.name}</p>
                      <p className="text-xs text-cool-steel">{badge.description}</p>
                    </div>
                    {badge.earned ? <Check className="w-4 h-4 text-sea-green shrink-0" /> : <X className="w-4 h-4 text-cool-steel shrink-0" />}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Memberships */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface rounded-2xl p-5 sm:p-6">
            <h2 className="text-base font-semibold text-pale-sky mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-air-force" /> Your Chamas
            </h2>
            {myChamas.length === 0 ? (
              <p className="text-sm text-cool-steel">You haven't joined any chamas yet.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {myChamas.map((c) => {
                  const me = myMember(c.address);
                  return (
                    <Link key={c.address} to={`/chama/${c.address}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-dark-spruce/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm text-pale-sky font-medium truncate">{c.name}</p>
                        <p className="text-xs text-cool-steel/70">Round {c.currentCycle}/{c.maxMembers} · {c.creator === myAddr ? "creator" : "member"}</p>
                      </div>
                      <span className="text-xs text-sea-green font-medium shrink-0">{me?.totalContributed ?? 0} USDT</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Reputation model */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6 bg-surface rounded-2xl p-5 sm:p-6">
          <h2 className="text-base font-semibold text-pale-sky mb-3">Reputation Breakdown</h2>
          <p className="text-sm text-cool-steel leading-relaxed">
            Your reputation starts at 50 / 100. On-time contributions add +2, repaying a loan adds +5.
            Missing a contribution costs −10, and defaulting on a loan costs −20. A score of 60+ unlocks borrowing.
          </p>
          <div className="mt-4 grid grid-cols-4 gap-3 text-center">
            <div className="bg-sea-green/10 rounded-xl p-3"><p className="text-lg font-bold text-sea-green">+2</p><p className="text-xs text-cool-steel">Contribution</p></div>
            <div className="bg-sea-green/10 rounded-xl p-3"><p className="text-lg font-bold text-sea-green">+5</p><p className="text-xs text-cool-steel">Loan Repaid</p></div>
            <div className="bg-destructive/10 rounded-xl p-3"><p className="text-lg font-bold text-destructive">−10</p><p className="text-xs text-cool-steel">Missed</p></div>
            <div className="bg-destructive/10 rounded-xl p-3"><p className="text-lg font-bold text-destructive">−20</p><p className="text-xs text-cool-steel">Default</p></div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;
