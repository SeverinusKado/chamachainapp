import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

import { programId } from "./client";

const seed = (s: string) => Buffer.from(s);
const u64le = (n: BN) => n.toArrayLike(Buffer, "le", 8);

function pda(seeds: (Buffer | Uint8Array)[]): PublicKey {
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export const configPda = () => pda([seed("config")]);
export const mintAuthorityPda = () => pda([seed("mint_authority")]);
export const chmMintPda = () => pda([seed("chm_mint")]);

export const chamaPda = (creator: PublicKey, id: BN) =>
  pda([seed("chama"), creator.toBuffer(), u64le(id)]);

export const treasuryPda = (chama: PublicKey) =>
  pda([seed("treasury"), chama.toBuffer()]);

export const cycleVaultPda = (chama: PublicKey) =>
  pda([seed("cycle_vault"), chama.toBuffer()]);

export const treasuryVaultPda = (chama: PublicKey) =>
  pda([seed("treasury_vault"), chama.toBuffer()]);

export const memberPda = (chama: PublicKey, owner: PublicKey) =>
  pda([seed("member"), chama.toBuffer(), owner.toBuffer()]);

export const reputationPda = (owner: PublicKey) =>
  pda([seed("reputation"), owner.toBuffer()]);

export const loanPda = (chama: PublicKey, loanId: BN) =>
  pda([seed("loan"), chama.toBuffer(), u64le(loanId)]);

export const ata = (mint: PublicKey, owner: PublicKey) =>
  getAssociatedTokenAddressSync(mint, owner);
