import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { motion } from "framer-motion";
import {
  ArrowLeft, Wallet, Users, CircleDollarSign, Clock, Check, AlertTriangle,
  ArrowDownRight, ExternalLink, Phone, Shield, Landmark, HandCoins, UserPlus, Coins,
} from "lucide-react";
import Layout from "@/components/Layout";
import SignInGate from "@/components/SignInGate";
import StatusBadge from "@/components/StatusBadge";
import SkeletonCard from "@/components/SkeletonCard";
import FiatPaymentModal from "@/components/FiatPaymentModal";
import { getTimeUntil, formatDate } from "@/lib/format";
import { shortenAddress } from "@/lib/solana";
import { useChama } from "@/hooks/useChamaData";
import { useAuth } from "@/lib/auth";
import { isSignableWallet, type AnchorWallet } from "@/lib/program/client";
import {
  contribute, payout, joinChama, depositToTreasury, requestLoan, approveLoan, repayLoan,
} from "@/lib/program/instructions";
import { requestTestUsdt, getUsdtBalance } from "@/lib/program/faucet";
import { FAUCET_ENABLED } from "@/lib/program/cluster";
import { useToast } from "@/hooks/use-toast";

const MIN_LOAN_REPUTATION = 60;

const ChamaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { authenticated } = useAuth();
  const { chama, loading, error, refresh } = useChama(id);
  const { toast } = useToast();

  const [busy, setBusy] = useState<string | null>(null);
  const [fiatOpen, setFiatOpen] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanDays, setLoanDays] = useState("30");
  const [depositAmount, setDepositAmount] = useState("");
  const [usdt, setUsdt] = useState<number | null>(null);

  const myAddr = publicKey?.toString();

  const refreshUsdt = useCallback(async () => {
    if (!publicKey) { setUsdt(null); return; }
    setUsdt(await getUsdtBalance(connection, publicKey));
  }, [connection, publicKey]);

  useEffect(() => { void refreshUsdt(); }, [refreshUsdt]);

  /** Run an on-chain action with pending/success/error toasts and a refresh. */
  const run = async (key: string, pending: string, fn: (w: AnchorWallet) => Promise<string>) => {
    if (!isSignableWallet(wallet)) {
      toast({ title: "Wallet Not Connected", description: "Connect a signing wallet.", variant: "destructive" });
      return;
    }
    setBusy(key);
    toast({ title: "Transaction Pending", description: pending });
    try {
      await fn(wallet);
      await Promise.all([refresh(), refreshUsdt()]);
      toast({ title: "Confirmed ✓", description: "Transaction succeeded on devnet." });
    } catch (err) {
      console.error(err);
      toast({ title: "Transaction Failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  if (!authenticated) {
    return <SignInGate action="view chama details" />;
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

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-pale-sky mb-2">Couldn't Load Chama</h2>
          <p className="text-cool-steel text-sm mb-6">The network request failed. Check your connection and try again.</p>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all">
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  if (!chama) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-pale-sky mb-2">Chama Not Found</h2>
          <p className="text-cool-steel text-sm mb-6">This chama doesn't exist on devnet or may not have loaded.</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const chamaPk = new PublicKey(chama.address);
  const userMember = chama.members.find((m) => m.owner === myAddr);
  const isMember = !!userMember;
  const isCreator = chama.creator === myAddr;
  const paidCount = chama.contributionsThisCycle;
  const allPaid = chama.memberCount > 0 && paidCount === chama.memberCount;
  const recipient = chama.members.find((m) => m.joinIndex === chama.payoutIndex);
  const canJoin =
    !isMember && chama.status === "active" && chama.memberCount < chama.maxMembers &&
    chama.currentCycle === 1 && chama.contributionsThisCycle === 0;

  // Derived payout schedule (one round per seat).
  const rounds = Array.from({ length: chama.maxMembers }, (_, i) => {
    const member = chama.members.find((m) => m.joinIndex === i);
    const status: "completed" | "current" | "upcoming" =
      i < chama.payoutIndex ? "completed" : i === chama.payoutIndex ? "current" : "upcoming";
    return { roundNumber: i + 1, recipient: member?.owner ?? null, status };
  });

  const myRep = userMember?.reputationScore ?? null;
  const myActiveLoan = chama.loans.find((l) => l.borrower === myAddr && l.status === "active");

  const doContribute = () =>
    run("contribute", "Sending your contribution...", (w) => contribute(connection, w, chamaPk));
  const doFaucet = () =>
    run("faucet", "Minting 100 test USDT...", (w) => requestTestUsdt(connection, w, 100));
  const doPayout = () => {
    if (!recipient) return;
    return run("payout", "Releasing the pool to the recipient...", (w) =>
      payout(connection, w, chamaPk, new PublicKey(recipient.owner)));
  };
  const doJoin = () => run("join", "Joining the chama...", (w) => joinChama(connection, w, chamaPk));
  const doDeposit = () => {
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) { toast({ title: "Enter an amount", variant: "destructive" }); return; }
    if (usdt === null || amt > usdt) {
      toast({ title: "Not enough test USDT", description: `You have ${usdt !== null ? usdt.toFixed(2) : "0"} USDT. Use the faucet to get more.`, variant: "destructive" });
      return;
    }
    return run("deposit", "Depositing into the treasury...", async (w) => {
      const sig = await depositToTreasury(connection, w, chamaPk, amt);
      setDepositAmount("");
      return sig;
    });
  };
  const doRequestLoan = () => {
    const amt = Number(loanAmount);
    const days = Number(loanDays);
    if (!amt || amt <= 0 || !days || days <= 0) { toast({ title: "Enter loan amount & duration", variant: "destructive" }); return; }
    const loanId = new BN(chama.treasury?.loanCount ?? 0);
    return run("requestLoan", "Requesting a loan...", async (w) => {
      const sig = await requestLoan(connection, w, chamaPk, loanId, amt, days);
      setLoanAmount("");
      return sig;
    });
  };
  const doApprove = (loanId: number, borrower: string) =>
    run(`approve-${loanId}`, "Approving & disbursing the loan...", (w) =>
      approveLoan(connection, w, chamaPk, new BN(loanId), new PublicKey(borrower)));
  const doRepay = (loanId: number) =>
    run(`repay-${loanId}`, "Repaying the loan...", (w) =>
      repayLoan(connection, w, chamaPk, new BN(loanId)));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-cool-steel text-sm hover:text-pale-sky transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Overview Panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-pale-sky">{chama.name}</h1>
              <p className="text-sm text-cool-steel mt-0.5">
                Created {formatDate(new Date(chama.createdAt * 1000).toISOString())} by {shortenAddress(chama.creator)}
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium self-start ${chama.status === "active" ? "bg-sea-green/15 text-sea-green" : "bg-cool-steel/15 text-cool-steel"}`}>
              {chama.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Cycle Pool", value: `${chama.cyclePoolBalance.toFixed(1)} USDT`, icon: CircleDollarSign, color: "text-sea-green", bg: "bg-sea-green/15" },
              { label: "Current Round", value: `${chama.currentCycle} / ${chama.maxMembers}`, icon: ArrowDownRight, color: "text-air-force", bg: "bg-air-force/15" },
              { label: "Members", value: `${chama.memberCount} / ${chama.maxMembers}`, icon: Users, color: "text-pale-sky", bg: "bg-pale-sky/10" },
              { label: "Next Payout", value: getTimeUntil(new Date(chama.cycleDeadline * 1000).toISOString()), icon: Clock, color: "text-cool-steel", bg: "bg-cool-steel/15" },
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
            {/* Members */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface rounded-2xl p-5 sm:p-6">
              <h2 className="text-base font-semibold text-pale-sky mb-4">Members</h2>
              <div className="space-y-2">
                {chama.members.map((member) => {
                  const isPayoutTurn = member.joinIndex === chama.payoutIndex;
                  return (
                    <div key={member.owner} className={`flex items-center justify-between p-3 rounded-xl transition-all ${isPayoutTurn ? "bg-sea-green/10 border border-sea-green/25" : "bg-dark-spruce/25"}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPayoutTurn ? "bg-sea-green/20" : "bg-air-force/15"}`}>
                          <Wallet className={`w-4 h-4 ${isPayoutTurn ? "text-sea-green" : "text-air-force"}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-pale-sky font-mono truncate">
                              {shortenAddress(member.owner, 6)}{member.owner === myAddr ? " (you)" : ""}
                            </span>
                            {isPayoutTurn && <span className="text-xs bg-sea-green/20 text-sea-green px-1.5 py-0.5 rounded-full font-medium shrink-0">Payout Turn</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Shield className="w-3 h-3 text-cool-steel" />
                            <span className="text-xs text-cool-steel">Rep: {member.reputationScore ?? "—"}</span>
                            {member.hasReceivedPayout && <span className="text-xs text-cool-steel">· paid out</span>}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={member.paidThisCycle ? "paid" : "pending"} size="sm" />
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Contribution Progress */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface rounded-2xl p-5 sm:p-6">
              <h2 className="text-base font-semibold text-pale-sky mb-4">Contribution Progress</h2>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-cool-steel">{paidCount} of {chama.memberCount} members paid</span>
                <span className="text-pale-sky font-semibold">{chama.memberCount ? Math.round((paidCount / chama.memberCount) * 100) : 0}%</span>
              </div>
              <div className="h-3 bg-dark-spruce/50 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${chama.memberCount ? (paidCount / chama.memberCount) * 100 : 0}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-sea-green rounded-full" />
              </div>
            </motion.div>

            {/* Payout Schedule */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface rounded-2xl p-5 sm:p-6">
              <h2 className="text-base font-semibold text-pale-sky mb-4">Payout Schedule</h2>
              <div className="space-y-2">
                {rounds.map((round) => (
                  <div key={round.roundNumber} className={`flex items-center justify-between p-3 rounded-xl ${round.status === "current" ? "bg-sea-green/8 border border-sea-green/20" : round.status === "completed" ? "bg-dark-spruce/20" : "bg-dark-spruce/10"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${round.status === "completed" ? "bg-sea-green/15 text-sea-green" : round.status === "current" ? "bg-cool-steel/15 text-cool-steel" : "bg-air-force/10 text-cool-steel"}`}>
                        {round.status === "completed" ? <Check className="w-4 h-4" /> : `R${round.roundNumber}`}
                      </div>
                      <div>
                        <p className="text-sm text-pale-sky font-medium">Round {round.roundNumber}</p>
                        <p className="text-xs text-cool-steel font-mono">{round.recipient ? shortenAddress(round.recipient, 6) : "seat open"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {round.status === "completed" ? (
                        <span className="text-xs text-sea-green font-medium">paid out</span>
                      ) : round.status === "current" ? (
                        <span className="text-xs bg-cool-steel/15 text-cool-steel px-2 py-0.5 rounded-full font-medium">In Progress</span>
                      ) : (
                        <span className="text-xs text-cool-steel">Upcoming</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Loans */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-surface rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-pale-sky">Loans</h2>
                {chama.treasury && (
                  <span className="text-xs text-cool-steel">Liquidity: <span className="text-sea-green font-semibold">{chama.treasury.availableLiquidity.toFixed(1)} USDT</span></span>
                )}
              </div>
              {chama.loans.length === 0 ? (
                <p className="text-sm text-cool-steel">No loans yet.</p>
              ) : (
                <div className="space-y-2">
                  {chama.loans.map((loan) => (
                    <div key={loan.address} className="flex items-center justify-between p-3 rounded-xl bg-dark-spruce/25">
                      <div className="min-w-0">
                        <p className="text-sm text-pale-sky font-medium">
                          {loan.amount} USDT <span className="text-cool-steel font-normal">→ due {loan.amountDue}</span>
                        </p>
                        <p className="text-xs text-cool-steel font-mono">#{loan.loanId} · {shortenAddress(loan.borrower, 5)}{loan.borrower === myAddr ? " (you)" : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loan.status === "active" ? "bg-air-force/15 text-air-force" : loan.status === "repaid" ? "bg-sea-green/15 text-sea-green" : loan.status === "defaulted" ? "bg-destructive/15 text-destructive" : "bg-cool-steel/15 text-cool-steel"}`}>
                          {loan.status}
                        </span>
                        {loan.status === "pending" && isCreator && (
                          <button onClick={() => doApprove(loan.loanId, loan.borrower)} disabled={busy === `approve-${loan.loanId}`} className="text-xs px-2.5 py-1 rounded-lg bg-sea-green/15 text-sea-green font-semibold hover:bg-sea-green/25 disabled:opacity-40">
                            Approve
                          </button>
                        )}
                        {loan.status === "active" && loan.borrower === myAddr && (
                          <button onClick={() => doRepay(loan.loanId)} disabled={busy === `repay-${loan.loanId}`} className="text-xs px-2.5 py-1 rounded-lg bg-primary/15 text-sea-green font-semibold hover:bg-primary/25 disabled:opacity-40">
                            Repay
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Request a loan */}
              {isMember && !myActiveLoan && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-cool-steel mb-2">
                    Request a loan {myRep !== null && myRep < MIN_LOAN_REPUTATION && (
                      <span className="text-destructive">· needs reputation ≥ {MIN_LOAN_REPUTATION} (you: {myRep})</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <input type="number" min="1" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="Amount USDT"
                      className="flex-1 px-3 py-2 rounded-lg bg-dark-spruce/40 border border-border text-pale-sky text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40" />
                    <input type="number" min="1" value={loanDays} onChange={(e) => setLoanDays(e.target.value)} placeholder="Days"
                      className="w-20 px-3 py-2 rounded-lg bg-dark-spruce/40 border border-border text-pale-sky text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40" />
                    <button onClick={doRequestLoan} disabled={busy === "requestLoan" || (myRep !== null && myRep < MIN_LOAN_REPUTATION)}
                      className="px-3 py-2 rounded-lg bg-air-force/15 text-air-force text-sm font-semibold hover:bg-air-force/25 disabled:opacity-40 inline-flex items-center gap-1.5">
                      <HandCoins className="w-4 h-4" /> Request
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-surface rounded-2xl p-5 sm:p-6">
              <h2 className="text-base font-semibold text-pale-sky mb-4">Actions</h2>
              <div className="space-y-3">
                {/* Join */}
                {canJoin && (
                  <button onClick={doJoin} disabled={busy === "join"} className="w-full px-4 py-3 rounded-xl bg-sea-green/15 text-sea-green font-semibold text-sm border border-sea-green/25 hover:bg-sea-green/25 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> {busy === "join" ? "Joining..." : "Join Chama"}
                  </button>
                )}

                {/* Contribute */}
                {isMember && (() => {
                  const lowFunds = usdt !== null && usdt < chama.contributionAmount && !userMember?.paidThisCycle;
                  return (
                    <>
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-cool-steel">Your USDT</span>
                        <span className="text-sea-green font-semibold">{usdt !== null ? usdt.toFixed(2) : "—"}</span>
                      </div>
                      {FAUCET_ENABLED && lowFunds && (
                        <button onClick={doFaucet} disabled={busy === "faucet"}
                          className="w-full px-4 py-2.5 rounded-xl bg-sea-green/15 text-sea-green font-semibold text-sm border border-sea-green/25 hover:bg-sea-green/25 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                          <Coins className={`w-4 h-4 ${busy === "faucet" ? "animate-pulse" : ""}`} />
                          {busy === "faucet" ? "Minting..." : "Get 100 test USDT"}
                        </button>
                      )}
                      <button onClick={doContribute}
                        disabled={busy === "contribute" || userMember?.paidThisCycle || chama.status !== "active" || lowFunds}
                        className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {busy === "contribute" ? (
                          <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Sending...</>
                        ) : userMember?.paidThisCycle ? (
                          <><Check className="w-4 h-4" /> Contribution Paid</>
                        ) : (
                          <><CircleDollarSign className="w-4 h-4" /> Pay {chama.contributionAmount} USDT</>
                        )}
                      </button>
                      {lowFunds && (
                        <p className="text-xs text-cool-steel text-center">Get test USDT above to fund your contribution.</p>
                      )}
                    </>
                  );
                })()}

                {/* Trigger Payout */}
                {isMember && (
                  <>
                    <button onClick={doPayout} disabled={busy === "payout" || !allPaid || chama.status !== "active"}
                      className="w-full px-4 py-3 rounded-xl bg-air-force/15 text-air-force font-semibold text-sm border border-air-force/25 hover:bg-air-force/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {busy === "payout" ? (
                        <><div className="w-4 h-4 border-2 border-air-force/30 border-t-air-force rounded-full animate-spin" /> Processing...</>
                      ) : (
                        <><ArrowDownRight className="w-4 h-4" /> Trigger Payout</>
                      )}
                    </button>
                    {!allPaid && (
                      <p className="text-xs text-cool-steel text-center flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-cool-steel" /> All members must pay before payout
                      </p>
                    )}
                  </>
                )}

                {/* Deposit to treasury */}
                {isMember && (() => {
                  const amt = Number(depositAmount);
                  const insufficient = amt > 0 && (usdt === null || amt > usdt);
                  return (
                    <div className="border-t border-border pt-3 mt-1">
                      <p className="text-xs text-cool-steel mb-2 flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> Fund the lending treasury</p>
                      <div className="flex gap-2">
                        <input type="number" min="1" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="USDT"
                          className="flex-1 px-3 py-2 rounded-lg bg-dark-spruce/40 border border-border text-pale-sky text-sm focus:outline-none focus:ring-2 focus:ring-sea-green/40" />
                        <button onClick={doDeposit} disabled={busy === "deposit" || insufficient} className="px-3 py-2 rounded-lg bg-dark-spruce/60 text-pale-sky text-sm font-semibold hover:bg-air-force/25 disabled:opacity-40 disabled:cursor-not-allowed">
                          {busy === "deposit" ? "Depositing..." : "Deposit"}
                        </button>
                      </div>
                      {insufficient && (
                        <p className="text-xs text-cool-steel mt-2">You have {usdt !== null ? usdt.toFixed(2) : "0"} USDT. Get test USDT above to fund the treasury.</p>
                      )}
                    </div>
                  );
                })()}

                {/* Fiat on-ramp (mobile money / bank) — pan-African, Simulated */}
                <div className="border-t border-border pt-3 mt-1">
                  <button onClick={() => setFiatOpen(true)} className="w-full px-4 py-3 rounded-xl bg-dark-spruce/40 text-cool-steel font-medium text-sm border border-border hover:bg-dark-spruce/60 hover:text-pale-sky transition-all flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Pay with mobile money / bank <span className="text-xs text-cool-steel/70 ml-1">(Simulated)</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Your Stats */}
            {userMember && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-surface rounded-2xl p-5 sm:p-6">
                <h2 className="text-base font-semibold text-pale-sky mb-4">Your Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-cool-steel">Total Contributed</span>
                    <span className="text-pale-sky font-medium">{userMember.totalContributed} USDT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cool-steel">Contributions Made</span>
                    <span className="text-pale-sky font-medium">{userMember.contributionsMade}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cool-steel">Defaults</span>
                    <span className={`font-medium ${userMember.contributionDefaults > 0 ? "text-destructive" : "text-sea-green"}`}>{userMember.contributionDefaults}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cool-steel">Reputation</span>
                    <span className="text-pale-sky font-bold">{userMember.reputationScore ?? "—"}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Explorer */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-surface rounded-2xl p-5 sm:p-6">
              <h2 className="text-base font-semibold text-pale-sky mb-3">Explorer</h2>
              <a href={`https://explorer.solana.com/address/${chama.address}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-air-force hover:text-pale-sky transition-colors">
                <ExternalLink className="w-4 h-4" /> View chama account
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      <FiatPaymentModal open={fiatOpen} onClose={() => setFiatOpen(false)} amount={chama.contributionAmount} walletAddress={myAddr} />
    </Layout>
  );
};

export default ChamaDetail;
