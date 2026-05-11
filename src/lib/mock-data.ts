export interface Member {
  wallet: string;
  reputationScore: number;
  totalContributed: number;
  cyclesCompleted: number;
  defaults: number;
  statusThisCycle: "paid" | "pending" | "defaulted";
  joinedAt: string;
}

export interface Round {
  roundNumber: number;
  recipientWallet: string;
  status: "completed" | "current" | "upcoming";
  paidAt?: string;
  amount?: number;
}

export interface Chama {
  id: string;
  name: string;
  contributionAmount: number;
  cycleDurationDays: number;
  maxMembers: number;
  currentRound: number;
  totalRounds: number;
  vaultBalance: number;
  creator: string;
  members: Member[];
  rounds: Round[];
  createdAt: string;
  nextPayoutDate: string;
}

export const MOCK_WALLETS = [
  "7xKX...f3Qm",
  "3nPv...8kWz",
  "9rYm...2jLx",
  "5tBq...6nRs",
  "2mFw...4pGh",
];

export const MOCK_CHAMAS: Chama[] = [
  {
    id: "chama_dev_circle",
    name: "Dev Circle",
    contributionAmount: 10,
    cycleDurationDays: 7,
    maxMembers: 5,
    currentRound: 2,
    totalRounds: 5,
    vaultBalance: 32.5,
    creator: "7xKX...f3Qm",
    createdAt: "2026-04-20T10:00:00Z",
    nextPayoutDate: "2026-05-10T10:00:00Z",
    members: [
      {
        wallet: "7xKX...f3Qm",
        reputationScore: 100,
        totalContributed: 20,
        cyclesCompleted: 2,
        defaults: 0,
        statusThisCycle: "paid",
        joinedAt: "2026-04-20T10:00:00Z",
      },
      {
        wallet: "3nPv...8kWz",
        reputationScore: 90,
        totalContributed: 20,
        cyclesCompleted: 2,
        defaults: 0,
        statusThisCycle: "paid",
        joinedAt: "2026-04-20T11:00:00Z",
      },
      {
        wallet: "9rYm...2jLx",
        reputationScore: 80,
        totalContributed: 10,
        cyclesCompleted: 1,
        defaults: 1,
        statusThisCycle: "pending",
        joinedAt: "2026-04-21T09:00:00Z",
      },
      {
        wallet: "5tBq...6nRs",
        reputationScore: 100,
        totalContributed: 20,
        cyclesCompleted: 2,
        defaults: 0,
        statusThisCycle: "paid",
        joinedAt: "2026-04-21T14:00:00Z",
      },
    ],
    rounds: [
      {
        roundNumber: 1,
        recipientWallet: "7xKX...f3Qm",
        status: "completed",
        paidAt: "2026-04-27T10:00:00Z",
        amount: 40,
      },
      {
        roundNumber: 2,
        recipientWallet: "3nPv...8kWz",
        status: "current",
      },
      {
        roundNumber: 3,
        recipientWallet: "9rYm...2jLx",
        status: "upcoming",
      },
      {
        roundNumber: 4,
        recipientWallet: "5tBq...6nRs",
        status: "upcoming",
      },
    ],
  },
  {
    id: "chama_nairobi_savers",
    name: "Nairobi Savers",
    contributionAmount: 25,
    cycleDurationDays: 14,
    maxMembers: 8,
    currentRound: 1,
    totalRounds: 8,
    vaultBalance: 125,
    creator: "3nPv...8kWz",
    createdAt: "2026-04-28T08:00:00Z",
    nextPayoutDate: "2026-05-12T08:00:00Z",
    members: [
      {
        wallet: "3nPv...8kWz",
        reputationScore: 100,
        totalContributed: 25,
        cyclesCompleted: 1,
        defaults: 0,
        statusThisCycle: "paid",
        joinedAt: "2026-04-28T08:00:00Z",
      },
      {
        wallet: "7xKX...f3Qm",
        reputationScore: 100,
        totalContributed: 25,
        cyclesCompleted: 1,
        defaults: 0,
        statusThisCycle: "paid",
        joinedAt: "2026-04-28T09:00:00Z",
      },
      {
        wallet: "5tBq...6nRs",
        reputationScore: 90,
        totalContributed: 25,
        cyclesCompleted: 1,
        defaults: 0,
        statusThisCycle: "paid",
        joinedAt: "2026-04-29T10:00:00Z",
      },
      {
        wallet: "9rYm...2jLx",
        reputationScore: 80,
        totalContributed: 25,
        cyclesCompleted: 1,
        defaults: 0,
        statusThisCycle: "pending",
        joinedAt: "2026-04-29T12:00:00Z",
      },
      {
        wallet: "2mFw...4pGh",
        reputationScore: 100,
        totalContributed: 25,
        cyclesCompleted: 1,
        defaults: 0,
        statusThisCycle: "paid",
        joinedAt: "2026-04-30T08:00:00Z",
      },
    ],
    rounds: [
      {
        roundNumber: 1,
        recipientWallet: "3nPv...8kWz",
        status: "current",
      },
      {
        roundNumber: 2,
        recipientWallet: "7xKX...f3Qm",
        status: "upcoming",
      },
      {
        roundNumber: 3,
        recipientWallet: "5tBq...6nRs",
        status: "upcoming",
      },
      {
        roundNumber: 4,
        recipientWallet: "9rYm...2jLx",
        status: "upcoming",
      },
      {
        roundNumber: 5,
        recipientWallet: "2mFw...4pGh",
        status: "upcoming",
      },
    ],
  },
  {
    id: "chama_builders_fund",
    name: "Builders Fund",
    contributionAmount: 50,
    cycleDurationDays: 30,
    maxMembers: 4,
    currentRound: 3,
    totalRounds: 4,
    vaultBalance: 95,
    creator: "5tBq...6nRs",
    createdAt: "2026-02-01T12:00:00Z",
    nextPayoutDate: "2026-05-15T12:00:00Z",
    members: [
      {
        wallet: "5tBq...6nRs",
        reputationScore: 100,
        totalContributed: 150,
        cyclesCompleted: 3,
        defaults: 0,
        statusThisCycle: "paid",
        joinedAt: "2026-02-01T12:00:00Z",
      },
      {
        wallet: "7xKX...f3Qm",
        reputationScore: 80,
        totalContributed: 100,
        cyclesCompleted: 2,
        defaults: 1,
        statusThisCycle: "pending",
        joinedAt: "2026-02-01T13:00:00Z",
      },
      {
        wallet: "2mFw...4pGh",
        reputationScore: 100,
        totalContributed: 150,
        cyclesCompleted: 3,
        defaults: 0,
        statusThisCycle: "paid",
        joinedAt: "2026-02-02T09:00:00Z",
      },
    ],
    rounds: [
      {
        roundNumber: 1,
        recipientWallet: "5tBq...6nRs",
        status: "completed",
        paidAt: "2026-03-03T12:00:00Z",
        amount: 150,
      },
      {
        roundNumber: 2,
        recipientWallet: "2mFw...4pGh",
        status: "completed",
        paidAt: "2026-04-02T12:00:00Z",
        amount: 150,
      },
      {
        roundNumber: 3,
        recipientWallet: "7xKX...f3Qm",
        status: "current",
      },
    ],
  },
];

export const USER_WALLET = "7xKX...f3Qm";

export const USER_PROFILE = {
  wallet: USER_WALLET,
  reputationScore: 87,
  totalContributed: 195,
  cyclesCompleted: 7,
  defaults: 1,
  chamasJoined: 3,
  chamasCreated: 1,
  badges: [
    {
      name: "Circle Veteran",
      description: "Completed 3+ cycles",
      earned: true,
    },
    {
      name: "Reliable Member",
      description: "0 defaults",
      earned: false,
    },
    {
      name: "Early Adopter",
      description: "Joined in first month",
      earned: true,
    },
    {
      name: "Circle Creator",
      description: "Created a chama",
      earned: true,
    },
  ],
  history: [
    { event: "Contributed 10 USDC to Dev Circle", date: "2026-05-03", type: "contribution" as const },
    { event: "Received payout from Builders Fund", date: "2026-04-02", type: "payout" as const },
    { event: "Contributed 50 USDC to Builders Fund", date: "2026-04-01", type: "contribution" as const },
    { event: "Missed contribution to Dev Circle", date: "2026-03-27", type: "default" as const },
    { event: "Received payout from Dev Circle", date: "2026-03-20", type: "payout" as const },
    { event: "Contributed 25 USDC to Nairobi Savers", date: "2026-03-14", type: "contribution" as const },
    { event: "Joined Nairobi Savers", date: "2026-04-28", type: "contribution" as const },
    { event: "Created Dev Circle", date: "2026-04-20", type: "contribution" as const },
  ],
};

export function getTimeUntil(dateStr: string): string {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return "Cycle ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
