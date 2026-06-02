// Shared shape for a single cluster's on-chain configuration.
// One of these objects exists per cluster (devnet.ts, mainnet.ts) and the
// selector in ../cluster.ts picks the active one based on VITE_CLUSTER.

export type ClusterName = "devnet" | "mainnet";

export interface ClusterConfig {
  CLUSTER: ClusterName;
  RPC_ENDPOINT: string;
  PROGRAM_ID: string;
  CONFIG_PDA: string;
  MINT_AUTHORITY_PDA: string;
  USDT_MINT: string;
  CHM_MINT: string;
  TOKEN_DECIMALS: number;
  // Devnet-only mock-USDT faucet authority secret. MUST be null on mainnet,
  // which uses a real USDT mint and has no faucet.
  FAUCET_AUTHORITY_SECRET: number[] | null;
}
