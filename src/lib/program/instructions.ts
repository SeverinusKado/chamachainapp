import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

import { getProgram, programId, type ChamaProgram, type AnchorWallet } from "./client";
import { USDT_MINT } from "./cluster";
import { toBaseUnits, SECONDS_PER_DAY } from "./units";
import {
  ata,
  chamaPda,
  chmMintPda,
  configPda,
  cycleVaultPda,
  loanPda,
  memberPda,
  mintAuthorityPda,
  reputationPda,
  treasuryPda,
  treasuryVaultPda,
} from "./pdas";

const usdtMint = new PublicKey(USDT_MINT);

type Wallet = AnchorWallet;

/** Build an `initialize_reputation` ix if the caller has no reputation yet. */
async function maybeInitReputation(
  program: ChamaProgram,
  owner: PublicKey,
): Promise<TransactionInstruction[]> {
  const rep = reputationPda(owner);
  const info = await program.provider.connection.getAccountInfo(rep);
  if (info) return [];
  const ix = await program.methods
    .initializeReputation()
    .accountsStrict({
      owner,
      reputation: rep,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return [ix];
}

export async function initializeReputation(
  connection: Connection,
  wallet: Wallet,
): Promise<string> {
  const program = getProgram(connection, wallet);
  const owner = wallet.publicKey;
  return program.methods
    .initializeReputation()
    .accountsStrict({
      owner,
      reputation: reputationPda(owner),
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function createChama(
  connection: Connection,
  wallet: Wallet,
  params: {
    id: BN;
    name: string;
    contributionWhole: number;
    cycleDurationDays: number;
    maxMembers: number;
  },
): Promise<{ signature: string; chama: PublicKey }> {
  const program = getProgram(connection, wallet);
  const creator = wallet.publicKey;
  const chama = chamaPda(creator, params.id);

  const pre = await maybeInitReputation(program, creator);

  const signature = await program.methods
    .createChama(
      params.id,
      params.name,
      toBaseUnits(params.contributionWhole),
      new BN(params.cycleDurationDays * SECONDS_PER_DAY),
      params.maxMembers,
    )
    .accountsStrict({
      creator,
      config: configPda(),
      usdtMint,
      chama,
      treasury: treasuryPda(chama),
      cycleVault: cycleVaultPda(chama),
      treasuryVault: treasuryVaultPda(chama),
      creatorMember: memberPda(chama, creator),
      creatorReputation: reputationPda(creator),
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .preInstructions(pre)
    .rpc();

  return { signature, chama };
}

export async function joinChama(
  connection: Connection,
  wallet: Wallet,
  chama: PublicKey,
): Promise<string> {
  const program = getProgram(connection, wallet);
  const joiner = wallet.publicKey;
  const pre = await maybeInitReputation(program, joiner);
  return program.methods
    .joinChama()
    .accountsStrict({
      joiner,
      chama,
      member: memberPda(chama, joiner),
      reputation: reputationPda(joiner),
      systemProgram: SystemProgram.programId,
    })
    .preInstructions(pre)
    .rpc();
}

export async function contribute(
  connection: Connection,
  wallet: Wallet,
  chama: PublicKey,
): Promise<string> {
  const program = getProgram(connection, wallet);
  const contributor = wallet.publicKey;
  const chmMint = chmMintPda();
  return program.methods
    .contribute()
    .accountsStrict({
      contributor,
      config: configPda(),
      chama,
      member: memberPda(chama, contributor),
      owner: contributor,
      reputation: reputationPda(contributor),
      usdtMint,
      chmMint,
      mintAuthority: mintAuthorityPda(),
      contributorUsdtAta: ata(usdtMint, contributor),
      contributorChmAta: ata(chmMint, contributor),
      cycleVault: cycleVaultPda(chama),
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function payout(
  connection: Connection,
  wallet: Wallet,
  chama: PublicKey,
  recipientOwner: PublicKey,
): Promise<string> {
  const program = getProgram(connection, wallet);
  return program.methods
    .payout()
    .accountsStrict({
      caller: wallet.publicKey,
      chama,
      recipientMember: memberPda(chama, recipientOwner),
      cycleVault: cycleVaultPda(chama),
      recipientUsdtAta: ata(usdtMint, recipientOwner),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function depositToTreasury(
  connection: Connection,
  wallet: Wallet,
  chama: PublicKey,
  amountWhole: number,
): Promise<string> {
  const program = getProgram(connection, wallet);
  const depositor = wallet.publicKey;
  const chmMint = chmMintPda();
  return program.methods
    .depositToTreasury(toBaseUnits(amountWhole))
    .accountsStrict({
      depositor,
      config: configPda(),
      chama,
      member: memberPda(chama, depositor),
      treasury: treasuryPda(chama),
      usdtMint,
      chmMint,
      mintAuthority: mintAuthorityPda(),
      depositorUsdtAta: ata(usdtMint, depositor),
      depositorChmAta: ata(chmMint, depositor),
      treasuryVault: treasuryVaultPda(chama),
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function requestLoan(
  connection: Connection,
  wallet: Wallet,
  chama: PublicKey,
  loanId: BN,
  amountWhole: number,
  durationDays: number,
): Promise<string> {
  const program = getProgram(connection, wallet);
  const borrower = wallet.publicKey;
  return program.methods
    .requestLoan(toBaseUnits(amountWhole), durationDays)
    .accountsStrict({
      borrower,
      chama,
      member: memberPda(chama, borrower),
      reputation: reputationPda(borrower),
      treasury: treasuryPda(chama),
      loan: loanPda(chama, loanId),
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function approveLoan(
  connection: Connection,
  wallet: Wallet,
  chama: PublicKey,
  loanId: BN,
  borrowerOwner: PublicKey,
): Promise<string> {
  const program = getProgram(connection, wallet);
  return program.methods
    .approveLoan(loanId)
    .accountsStrict({
      creator: wallet.publicKey,
      chama,
      treasury: treasuryPda(chama),
      loan: loanPda(chama, loanId),
      borrowerMember: memberPda(chama, borrowerOwner),
      treasuryVault: treasuryVaultPda(chama),
      borrowerUsdtAta: ata(usdtMint, borrowerOwner),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function repayLoan(
  connection: Connection,
  wallet: Wallet,
  chama: PublicKey,
  loanId: BN,
): Promise<string> {
  const program = getProgram(connection, wallet);
  const borrower = wallet.publicKey;
  return program.methods
    .repayLoan(loanId)
    .accountsStrict({
      borrower,
      chama,
      treasury: treasuryPda(chama),
      loan: loanPda(chama, loanId),
      member: memberPda(chama, borrower),
      reputation: reputationPda(borrower),
      treasuryVault: treasuryVaultPda(chama),
      borrowerUsdtAta: ata(usdtMint, borrower),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export { programId };
