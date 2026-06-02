// Cluster selector. The active cluster is chosen at build time via the
// VITE_CLUSTER env var (default "devnet"). All other modules import the
// resolved constants from here, so switching clusters never touches call sites.
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import type { ClusterConfig, ClusterName } from "./clusters/types";
import { devnet } from "./clusters/devnet";
import { mainnet } from "./clusters/mainnet";

const CONFIGS: Record<ClusterName, ClusterConfig> = { devnet, mainnet };

function selectCluster(): ClusterConfig {
  const requested = (import.meta.env.VITE_CLUSTER as ClusterName | undefined) ?? "devnet";
  const config = CONFIGS[requested];
  if (!config) {
    throw new Error(
      `Unknown VITE_CLUSTER "${requested}". Expected "devnet" or "mainnet".`,
    );
  }
  // Fail fast: an unconfigured cluster (empty PROGRAM_ID) must never run.
  // Mainnet stays empty until the runtime-crash fix and security review are done.
  if (!config.PROGRAM_ID) {
    throw new Error(
      `Cluster "${requested}" is not configured (empty PROGRAM_ID). It is gated ` +
        `until the runtime-crash fix (Gate 1) and security review (Gate 2) are ` +
        `complete. Run with VITE_CLUSTER=devnet (the default).`,
    );
  }
  return config;
}

const active = selectCluster();

export const CLUSTER = active.CLUSTER;
export const RPC_ENDPOINT = active.RPC_ENDPOINT;
export const PROGRAM_ID = active.PROGRAM_ID;
export const CONFIG_PDA = active.CONFIG_PDA;
export const MINT_AUTHORITY_PDA = active.MINT_AUTHORITY_PDA;
export const USDT_MINT = active.USDT_MINT;
export const CHM_MINT = active.CHM_MINT;
export const TOKEN_DECIMALS = active.TOKEN_DECIMALS;
export const FAUCET_AUTHORITY_SECRET = active.FAUCET_AUTHORITY_SECRET;

// Wallet-adapter network derived from the active cluster.
export const NETWORK: WalletAdapterNetwork =
  CLUSTER === "mainnet"
    ? WalletAdapterNetwork.Mainnet
    : WalletAdapterNetwork.Devnet;

// The mock-USDT faucet only exists on devnet (worthless test token). On mainnet
// FAUCET_AUTHORITY_SECRET is null, so the faucet UI and helper are disabled.
export const FAUCET_ENABLED = CLUSTER === "devnet" && FAUCET_AUTHORITY_SECRET !== null;
