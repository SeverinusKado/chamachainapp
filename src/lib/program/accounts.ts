import { Connection, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { getProgram, type ChamaProgram } from "./client";
import {
  cycleVaultPda,
  treasuryVaultPda,
  reputationPda,
  memberPda,
  treasuryPda,
} from "./pdas";
import { fromBaseUnits, SECONDS_PER_DAY } from "./units";

export interface MemberView {
  owner: string;
  joinIndex: number;
  hasReceivedPayout: boolean;
  contributionsMade: number;
  contributionDefaults: number;
  totalContributed: number;
  activeLoan: string | null;
  paidThisCycle: boolean;
  reputationScore: number | null;
}

export interface TreasuryView {
  totalPooled: number;
  availableLiquidity: number;
  totalLoanedOut: number;
  totalRepaid: number;
  loanCount: number;
}

export interface LoanView {
  address: string;
  borrower: string;
  loanId: number;
  amount: number;
  amountDue: number;
  interestBps: number;
  status: "pending" | "active" | "repaid" | "defaulted";
  dueAt: number;
}

export interface ReputationView {
  score: number;
  onTimeContributions: number;
  contributionDefaults: number;
  loansRepaid: number;
  loansDefaulted: number;
}

export interface ChamaView {
  address: string;
  creator: string;
  id: string;
  name: string;
  contributionAmount: number;
  cycleDurationDays: number;
  maxMembers: number;
  memberCount: number;
  currentCycle: number;
  payoutIndex: number;
  contributionsThisCycle: number;
  status: "active" | "completed";
  createdAt: number;
  cycleDeadline: number;
  members: MemberView[];
  treasury: TreasuryView | null;
  loans: LoanView[];
  cyclePoolBalance: number;
}

const statusName = (s: Record<string, unknown>): "active" | "completed" =>
  "completed" in s ? "completed" : "active";

const loanStatusName = (s: Record<string, unknown>): LoanView["status"] => {
  if ("repaid" in s) return "repaid";
  if ("defaulted" in s) return "defaulted";
  if ("active" in s) return "active";
  return "pending";
};

async function tokenBalance(connection: Connection, ataPk: PublicKey): Promise<number> {
  try {
    const r = await connection.getTokenAccountBalance(ataPk);
    return r.value.uiAmount ?? 0;
  } catch {
    return 0;
  }
}

export async function fetchAllChamas(connection: Connection): Promise<ChamaView[]> {
  const program = getProgram(connection);
  const raw = await program.account.chama.all();
  const views = await Promise.all(
    raw.map((r) => assembleChamaView(program, connection, r.publicKey, r.account)),
  );
  return views.sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchChama(
  connection: Connection,
  address: PublicKey,
): Promise<ChamaView | null> {
  const program = getProgram(connection);
  const account = await program.account.chama.fetchNullable(address);
  if (!account) return null;
  return assembleChamaView(program, connection, address, account);
}

export async function fetchReputation(
  connection: Connection,
  owner: PublicKey,
): Promise<ReputationView | null> {
  const program = getProgram(connection);
  const r = await program.account.reputation.fetchNullable(reputationPda(owner));
  if (!r) return null;
  return {
    score: r.score as number,
    onTimeContributions: r.onTimeContributions as number,
    contributionDefaults: r.contributionDefaults as number,
    loansRepaid: r.loansRepaid as number,
    loansDefaulted: r.loansDefaulted as number,
  };
}

export async function fetchMember(
  connection: Connection,
  chama: PublicKey,
  owner: PublicKey,
): Promise<MemberView | null> {
  const program = getProgram(connection);
  const account = await program.account.member.fetchNullable(memberPda(chama, owner));
  if (!account) return null;
  return mapMember(account, null, 0);
}

function mapMember(
  m: Record<string, unknown>,
  reputationScore: number | null,
  currentCycle: number,
): MemberView {
  const activeLoan = m.activeLoan as PublicKey | null;
  return {
    owner: (m.owner as PublicKey).toBase58(),
    joinIndex: m.joinIndex as number,
    hasReceivedPayout: m.hasReceivedPayout as boolean,
    contributionsMade: m.contributionsMade as number,
    contributionDefaults: m.contributionDefaults as number,
    totalContributed: fromBaseUnits(m.totalContributed as BN),
    activeLoan: activeLoan ? activeLoan.toBase58() : null,
    paidThisCycle: (m.lastProcessedCycle as number) === currentCycle,
    reputationScore,
  };
}

async function assembleChamaView(
  program: ChamaProgram,
  connection: Connection,
  address: PublicKey,
  chama: Record<string, unknown>,
): Promise<ChamaView> {
  const currentCycle = chama.currentCycle as number;

  // Members of this chama (member.chama is the first field, at offset 8).
  const memberAccounts = await program.account.member.all([
    { memcmp: { offset: 8, bytes: address.toBase58() } },
  ]);

  const repPdas = memberAccounts.map((m) => reputationPda(m.account.owner as PublicKey));
  const reps = repPdas.length
    ? await program.account.reputation.fetchMultiple(repPdas)
    : [];
  const members = memberAccounts
    .map((m, i) => {
      const rep = reps[i] as Record<string, unknown> | null;
      return mapMember(m.account, rep ? (rep.score as number) : null, currentCycle);
    })
    .sort((a, b) => a.joinIndex - b.joinIndex);

  let treasury: TreasuryView | null = null;
  try {
    const t = await program.account.treasury.fetchNullable(treasuryPda(address));
    if (t) {
      treasury = {
        totalPooled: fromBaseUnits(t.totalPooled as BN),
        availableLiquidity: fromBaseUnits(t.availableLiquidity as BN),
        totalLoanedOut: fromBaseUnits(t.totalLoanedOut as BN),
        totalRepaid: fromBaseUnits(t.totalRepaid as BN),
        loanCount: (t.loanCount as BN).toNumber(),
      };
    }
  } catch {
    /* ignore */
  }

  // Loans for this chama (loan.chama at offset 8).
  const loanAccounts = await program.account.loanRecord.all([
    { memcmp: { offset: 8, bytes: address.toBase58() } },
  ]);
  const loans: LoanView[] = loanAccounts
    .map((l) => ({
      address: l.publicKey.toBase58(),
      borrower: (l.account.borrower as PublicKey).toBase58(),
      loanId: (l.account.loanId as BN).toNumber(),
      amount: fromBaseUnits(l.account.amount as BN),
      amountDue: fromBaseUnits(l.account.amountDue as BN),
      interestBps: l.account.interestBps as number,
      status: loanStatusName(l.account.status as Record<string, unknown>),
      dueAt: (l.account.dueAt as BN).toNumber(),
    }))
    .sort((a, b) => a.loanId - b.loanId);

  const cyclePoolBalance = await tokenBalance(connection, cycleVaultPda(address));

  return {
    address: address.toBase58(),
    creator: (chama.creator as PublicKey).toBase58(),
    id: (chama.id as BN).toString(),
    name: chama.name as string,
    contributionAmount: fromBaseUnits(chama.contributionAmount as BN),
    cycleDurationDays: Math.round((chama.cycleDurationSecs as BN).toNumber() / SECONDS_PER_DAY),
    maxMembers: chama.maxMembers as number,
    memberCount: chama.memberCount as number,
    currentCycle,
    payoutIndex: chama.payoutIndex as number,
    contributionsThisCycle: chama.contributionsThisCycle as number,
    status: statusName(chama.status as Record<string, unknown>),
    createdAt: (chama.createdAt as BN).toNumber(),
    cycleDeadline: (chama.cycleDeadline as BN).toNumber(),
    members,
    treasury,
    loans,
    cyclePoolBalance,
  };
}

export { treasuryVaultPda };
