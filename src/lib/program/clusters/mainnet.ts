// PLACEHOLDER — mainnet is intentionally NOT wired yet.
//
// This config stays empty until BOTH release gates clear:
//   Gate 1 — the SBF runtime-crash fix is verified, and
//   Gate 2 — the security review is complete.
//
// The empty PROGRAM_ID makes ../cluster.ts throw at load time if someone runs
// with VITE_CLUSTER=mainnet, so we can never accidentally operate against an
// unconfigured mainnet. When the gates clear, populate this by running:
//   CLUSTER=mainnet ANCHOR_PROVIDER_URL=... ANCHOR_WALLET=... \
//     USDT_MINT=<real mainnet USDT mint> yarn ts-node scripts/bootstrap.ts
import type { ClusterConfig } from "./types";

export const mainnet: ClusterConfig = {
  CLUSTER: "mainnet",
  RPC_ENDPOINT: "https://api.mainnet-beta.solana.com",
  PROGRAM_ID: "",
  CONFIG_PDA: "",
  MINT_AUTHORITY_PDA: "",
  USDT_MINT: "", // real mainnet USDT mint, supplied at bootstrap time
  CHM_MINT: "",
  TOKEN_DECIMALS: 6,
  // No faucet on mainnet — a real mint is never publicly mintable.
  FAUCET_AUTHORITY_SECRET: null,
};
