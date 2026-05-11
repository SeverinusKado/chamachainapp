import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import {
  Wallet,
  Shield,
  Award,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Users,
  Star,
  Zap,
  Check,
  X,
  Copy,
} from "lucide-react";
import Layout from "@/components/Layout";
import SkeletonCard from "@/components/SkeletonCard";
import { USER_PROFILE, formatDate } from "@/lib/mock-data";
import { useWalletBalance } from "@/hooks/useWalletBalance";

const ReputationGauge: React.FC<{ score: number }> = ({ score }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 80 ? "#7c3aed" : score >= 50 ? "#a78bfa" : "#ef4444";

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="#1a1a2e"
          strokeWidth="10"
          fill="none"
        />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-pale-sky"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-cool-steel">/ 100</span>
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { balance } = useWalletBalance();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  if (!connected) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Wallet className="w-12 h-12 text-cool-steel mx-auto mb-4" />
          <h2 className="text-xl font-bold text-pale-sky mb-2">Wallet Not Connected</h2>
          <p className="text-cool-steel text-sm">Connect your wallet to view your profile.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
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

  const { reputationScore, totalContributed, cyclesCompleted, defaults, chamasJoined, chamasCreated, badges, history } =
    USER_PROFILE;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-pale-sky mb-2">Reputation Profile</h1>
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <p className="text-sm text-cool-steel font-mono break-all">
              {publicKey?.toString() ?? USER_PROFILE.wallet}
            </p>
            {publicKey && (
              <button
                onClick={handleCopy}
                className="p-1 rounded text-cool-steel hover:text-pale-sky transition-colors shrink-0"
              >
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

        {/* Gauge + Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-2xl p-6 sm:p-8 mb-6"
        >
          <ReputationGauge score={reputationScore} />
          <p className="text-center text-sm text-cool-steel mt-3">Reputation Score</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              {
                label: "Contributed",
                value: `${totalContributed} USDC`,
                icon: CircleDollarSign,
                color: "text-sea-green",
              },
              {
                label: "Cycles",
                value: cyclesCompleted,
                icon: TrendingUp,
                color: "text-air-force",
              },
              {
                label: "Defaults",
                value: defaults,
                icon: TrendingDown,
                color: defaults > 0 ? "text-destructive" : "text-sea-green",
              },
              {
                label: "Chamas",
                value: chamasJoined,
                icon: Users,
                color: "text-pale-sky",
              },
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface rounded-2xl p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold text-pale-sky mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-sea-green" />
              Badges
            </h2>
            <div className="space-y-3">
              {badges.map((badge) => {
                const iconMap: Record<string, React.FC<{ className?: string }>> = {
                  "Circle Veteran": Star,
                  "Reliable Member": Shield,
                  "Early Adopter": Zap,
                  "Circle Creator": Users,
                };
                const Icon = iconMap[badge.name] || Award;
                return (
                  <div
                    key={badge.name}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      badge.earned
                        ? "bg-sea-green/8 border border-sea-green/20"
                        : "bg-dark-spruce/20 opacity-50"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        badge.earned ? "bg-sea-green/15" : "bg-air-force/10"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${badge.earned ? "text-sea-green" : "text-cool-steel"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          badge.earned ? "text-pale-sky" : "text-cool-steel"
                        }`}
                      >
                        {badge.name}
                      </p>
                      <p className="text-xs text-cool-steel">{badge.description}</p>
                    </div>
                    {badge.earned ? (
                      <Check className="w-4 h-4 text-sea-green shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-cool-steel shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* History */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface rounded-2xl p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold text-pale-sky mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-air-force" />
              Activity History
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {history.map((entry, i) => {
                const typeConfig = {
                  contribution: { dot: "bg-sea-green", text: "text-cool-steel" },
                  payout: { dot: "bg-air-force", text: "text-cool-steel" },
                  default: { dot: "bg-destructive", text: "text-destructive/80" },
                };
                const config = typeConfig[entry.type];
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-dark-spruce/20 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${config.dot} mt-1.5 shrink-0`} />
                    <div className="min-w-0">
                      <p className={`text-sm ${config.text}`}>{entry.event}</p>
                      <p className="text-xs text-cool-steel/60">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Extra Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-surface rounded-2xl p-5 sm:p-6"
        >
          <h2 className="text-base font-semibold text-pale-sky mb-3">Reputation Breakdown</h2>
          <p className="text-sm text-cool-steel leading-relaxed">
            Your reputation starts at 100. Each completed cycle earns +10 points.
            Each default deducts -20 points. Maintain a high score to build trust in your savings circles.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-sea-green/10 rounded-xl p-3">
              <p className="text-lg font-bold text-sea-green">+10</p>
              <p className="text-xs text-cool-steel">Per Cycle</p>
            </div>
            <div className="bg-destructive/10 rounded-xl p-3">
              <p className="text-lg font-bold text-destructive">-20</p>
              <p className="text-xs text-cool-steel">Per Default</p>
            </div>
            <div className="bg-air-force/10 rounded-xl p-3">
              <p className="text-lg font-bold text-air-force">{chamasCreated}</p>
              <p className="text-xs text-cool-steel">Created</p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;
