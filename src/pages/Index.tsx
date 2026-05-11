import React from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Shield, Users, Repeat, ArrowRight, Zap, Lock, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";

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
    description: "Members contribute USDC every cycle. Smart contracts enforce deadlines and track who has paid.",
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

const Index: React.FC = () => {
  const { connected } = useWallet();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-32 w-96 h-96 bg-sea-green/8 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-0 w-80 h-80 bg-air-force/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 relative">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} custom={0} className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sea-green/10 border border-sea-green/20 text-sea-green text-xs font-medium">
                <Zap className="w-3 h-3" />
                Powered by Solana
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5"
            >
              <span className="text-gradient-hero">Trustless Savings Circles</span>
              <br />
              <span className="text-sea-green">on Solana</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-cool-steel text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed"
            >
              ChamaChain brings the tradition of community savings groups on-chain.
              Contribute, rotate payouts, and build trust, all without intermediaries.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center">
              {connected ? (
                <>
                  <Link
                    to="/create"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all duration-300"
                  >
                    Create a Chama
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-elevated text-pale-sky font-semibold text-sm hover:bg-air-force/25 transition-all duration-300"
                  >
                    View Dashboard
                  </Link>
                </>
              ) : (
                <div className="text-cool-steel text-sm bg-surface rounded-xl px-5 py-3 inline-block">
                  Connect your wallet to get started
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-pale-sky mb-3">How It Works</h2>
            <p className="text-cool-steel text-sm max-w-md mx-auto">
              Three simple steps to trustless community savings
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-surface rounded-xl p-6 text-center group hover:bg-surface-elevated transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/25 transition-colors">
                    <Icon className="w-6 h-6 text-sea-green" />
                  </div>
                  <div className="text-xs font-semibold text-sea-green mb-2">Step {i + 1}</div>
                  <h3 className="text-lg font-semibold text-pale-sky mb-2">{step.title}</h3>
                  <p className="text-sm text-cool-steel leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-pale-sky mb-3">Why ChamaChain?</h2>
            <p className="text-cool-steel text-sm max-w-md mx-auto">
              Built for communities that value transparency and accountability
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-surface rounded-xl p-6 group hover:bg-surface-elevated transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-air-force/15 flex items-center justify-center mb-4 group-hover:bg-air-force/25 transition-colors">
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
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center bg-surface-elevated rounded-2xl p-8 sm:p-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-pale-sky mb-3">
              Ready to start saving together?
            </h2>
            <p className="text-cool-steel text-sm mb-6">
              Join the trustless savings revolution on Solana.
            </p>
            {connected ? (
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all"
              >
                Create Your First Chama
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <p className="text-cool-steel text-sm bg-surface rounded-xl px-5 py-3 inline-block">
                Connect your wallet above to begin
              </p>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
