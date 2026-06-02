import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, Repeat, ArrowRight, Zap, Lock, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5 },
  }),
};

const steps = [
  {
    icon: Users,
    title: "Create or Join",
    description: "Start a savings circle with friends or join an existing one. Set contribution amounts and cycle duration.",
  },
  {
    icon: Repeat,
    title: "Contribute Each Cycle",
    description: "Members contribute USDT every cycle. Smart contracts enforce deadlines and track who has paid.",
  },
  {
    icon: Shield,
    title: "Receive Your Payout",
    description: "Each cycle, one member receives the pooled funds. Fair rotation, no middlemen, fully on-chain.",
  },
];

const features = [
  {
    icon: Lock,
    title: "Trustless & Transparent",
    description: "Every transaction is recorded on Solana. No admin can tamper with funds.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description: "Payouts settle in seconds with Solana's blazing fast finality.",
  },
  {
    icon: TrendingUp,
    title: "Reputation System",
    description: "Members build on-chain reputation. Defaults are tracked, reliable members are rewarded.",
  },
];

const trustStats = [
  { value: "0%", label: "Platform fees" },
  { value: "100%", label: "On-chain & auditable" },
  { value: "~400ms", label: "Settlement finality" },
];

const Index: React.FC = () => {
  const { authenticated } = useAuth();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Ambient aurora + grid, layered behind content */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-grid" />
          <div className="aurora-blob animate-aurora absolute -top-40 -left-32 w-[34rem] h-[34rem] opacity-60" />
          <div
            className="aurora-blob animate-aurora absolute -top-20 right-[-10rem] w-[30rem] h-[30rem] opacity-50"
            style={{ animationDelay: "-6s", animationDuration: "22s" }}
          />
          <div
            className="aurora-blob animate-aurora absolute top-40 left-1/3 w-[26rem] h-[26rem] opacity-40"
            style={{ animationDelay: "-12s", animationDuration: "26s" }}
          />
        </div>

        <div className="container mx-auto px-4 pt-20 pb-24 sm:pt-28 sm:pb-32 relative">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6 flex justify-center">
              <span className="pill">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Live on Solana
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="text-gradient-hero">Savings circles,</span>
              <br />
              <span className="text-gradient">reinvented on-chain</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-cool-steel text-base sm:text-lg max-w-xl mx-auto mb-9 leading-relaxed"
            >
              ChamaChain brings the timeless tradition of community savings groups
              on-chain. Contribute, rotate payouts, and build trust without a
              middleman holding the bag.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
              {authenticated ? (
                <>
                  <Link
                    to="/create"
                    className="btn-shine group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:glow-strong hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Create a Chama
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-gradient text-pale-sky font-semibold text-sm hover:-translate-y-0.5 transition-all duration-300"
                  >
                    View Dashboard
                  </Link>
                </>
              ) : (
                <div className="inline-flex items-center gap-2 text-cool-steel text-sm border-gradient rounded-xl px-5 py-3.5">
                  <Lock className="w-4 h-4 text-sea-green" />
                  Connect & sign in with your wallet to get started
                </div>
              )}
            </motion.div>

            {/* Trust bar */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="mt-14 grid grid-cols-3 gap-px max-w-lg mx-auto rounded-2xl overflow-hidden bg-border/40"
            >
              {trustStats.map((s) => (
                <div key={s.label} className="bg-card/60 backdrop-blur-sm px-3 py-5">
                  <div className="font-display text-xl sm:text-2xl font-bold text-sea-green tnum">
                    {s.value}
                  </div>
                  <div className="text-[0.7rem] sm:text-xs text-cool-steel mt-1 leading-tight">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="pill mb-4">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-pale-sky mb-3">
              Three steps to trustless saving
            </h2>
            <p className="text-cool-steel text-sm sm:text-base max-w-md mx-auto">
              No paperwork, no treasurer, no trust required.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="card-elite p-7 group"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 ring-1 ring-primary/20 flex items-center justify-center group-hover:bg-primary/25 group-hover:scale-105 transition-all">
                      <Icon className="w-6 h-6 text-sea-green" />
                    </div>
                    <span className="font-display text-5xl font-bold text-primary/10 leading-none select-none">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-pale-sky mb-2">{step.title}</h3>
                  <p className="text-sm text-cool-steel leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="pill mb-4">Why ChamaChain</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-pale-sky mb-3">
              Built for communities that count
            </h2>
            <p className="text-cool-steel text-sm sm:text-base max-w-md mx-auto">
              Transparency and accountability, enforced by the chain, not a person.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="card-elite p-7 group"
                >
                  <div className="w-11 h-11 rounded-lg bg-air-force/15 ring-1 ring-air-force/20 flex items-center justify-center mb-5 group-hover:bg-air-force/25 transition-colors">
                    <Icon className="w-5 h-5 text-air-force" />
                  </div>
                  <h3 className="text-base font-semibold text-pale-sky mb-2">{feat.title}</h3>
                  <p className="text-sm text-cool-steel leading-relaxed">{feat.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative max-w-3xl mx-auto text-center card-elite p-10 sm:p-14 overflow-hidden"
          >
            <div className="aurora-blob animate-aurora absolute -bottom-32 -right-20 w-72 h-72 opacity-40 pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl sm:text-4xl font-bold text-pale-sky mb-4">
                Ready to save together?
              </h2>
              <p className="text-cool-steel text-sm sm:text-base mb-8 max-w-md mx-auto">
                Spin up your first circle in under a minute. No fees, no custody, no catch.
              </p>
              {authenticated ? (
                <Link
                  to="/create"
                  className="btn-shine group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:glow-strong hover:-translate-y-0.5 transition-all"
                >
                  Create Your First Chama
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <p className="inline-flex items-center gap-2 text-cool-steel text-sm border-gradient rounded-xl px-5 py-3.5">
                  <Lock className="w-4 h-4 text-sea-green" />
                  Connect & sign in with your wallet above to begin
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
