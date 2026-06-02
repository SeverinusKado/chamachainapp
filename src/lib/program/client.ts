import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

import idl from "./idl/chamachain.json";
import type { Chamachain } from "./idl/chamachain";
import { PROGRAM_ID } from "./cluster";

export const programId = new PublicKey(PROGRAM_ID);

export type AnchorWallet = {
  publicKey: PublicKey;
  signTransaction: NonNullable<WalletContextState["signTransaction"]>;
  signAllTransactions: NonNullable<WalletContextState["signAllTransactions"]>;
};

// Read-only provider for fetching accounts; signing throws.
function readonlyWallet(): AnchorWallet {
  const reject = () => Promise.reject(new Error("read-only wallet"));
  return {
    publicKey: PublicKey.default,
    signTransaction: reject as never,
    signAllTransactions: reject as never,
  };
}

export function getProvider(
  connection: Connection,
  wallet?: AnchorWallet | null,
): AnchorProvider {
  return new AnchorProvider(connection, (wallet ?? readonlyWallet()) as never, {
    commitment: "confirmed",
  });
}

export type ChamaProgram = Program<Chamachain>;

export function getProgram(
  connection: Connection,
  wallet?: AnchorWallet | null,
): ChamaProgram {
  return new Program(idl as Chamachain, getProvider(connection, wallet));
}

export function isSignableWallet(
  w: WalletContextState,
): w is WalletContextState & AnchorWallet {
  return !!w.publicKey && !!w.signTransaction && !!w.signAllTransactions;
}
