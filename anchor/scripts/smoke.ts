/**
 * Devnet smoke test: drives the live program through the same account layout
 * the frontend uses, to catch any client-side PDA / account-ordering / IDL
 * mismatch before it shows up in the browser.
 *
 *   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=$HOME/.config/solana/id.json \
 *   yarn ts-node scripts/smoke.ts
 */
import * as anchor from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountIdempotent,
  getAssociatedTokenAddressSync,
  mintTo,
} from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

import { USDT_MINT, FAUCET_AUTHORITY_SECRET } from "../../src/lib/program/cluster";

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const seed = (s: string) => Buffer.from(s);
const u64 = (n: number) => new anchor.BN(n).toArrayLike(Buffer, "le", 8);

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const idl = JSON.parse(fs.readFileSync(path.join(__dirname, "../target/idl/chamachain.json"), "utf8"));
  const program = new anchor.Program(idl, provider);
  const pid = program.programId;
  const me = provider.wallet.publicKey;

  const pda = (s: (Buffer | Uint8Array)[]) => PublicKey.findProgramAddressSync(s, pid)[0];
  const config = pda([seed("config")]);
  const mintAuth = pda([seed("mint_authority")]);
  const chmMint = pda([seed("chm_mint")]);
  const usdtMint = new PublicKey(USDT_MINT);

  const id = Date.now();
  const chama = pda([seed("chama"), me.toBuffer(), u64(id)]);
  const treasury = pda([seed("treasury"), chama.toBuffer()]);
  const cycleVault = pda([seed("cycle_vault"), chama.toBuffer()]);
  const treasuryVault = pda([seed("treasury_vault"), chama.toBuffer()]);
  const member = pda([seed("member"), chama.toBuffer(), me.toBuffer()]);
  const reputation = pda([seed("reputation"), me.toBuffer()]);

  // reputation (idempotent)
  if (!(await provider.connection.getAccountInfo(reputation))) {
    await program.methods.initializeReputation().accountsStrict({
      owner: me, reputation, systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();
    console.log("✓ initialize_reputation");
  } else console.log("· reputation already exists");

  // create_chama: 1 USDT contribution, 2 seats, 30-day cycle
  await program.methods.createChama(
    new anchor.BN(id), "Smoke Test", new anchor.BN(1_000_000), new anchor.BN(30 * 86400), 2,
  ).accountsStrict({
    creator: me, config, usdtMint, chama, treasury, cycleVault, treasuryVault,
    creatorMember: member, creatorReputation: reputation,
    tokenProgram: TOKEN_PROGRAM, systemProgram: anchor.web3.SystemProgram.programId,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  }).rpc();
  console.log("✓ create_chama", chama.toBase58());

  // fund deployer with 10 USDT via faucet authority
  const faucet = Keypair.fromSecretKey(Uint8Array.from(FAUCET_AUTHORITY_SECRET));
  const payer = (provider.wallet as anchor.Wallet).payer;
  await createAssociatedTokenAccountIdempotent(provider.connection, payer, usdtMint, me);
  await mintTo(provider.connection, payer, usdtMint, getAssociatedTokenAddressSync(usdtMint, me), faucet, 10_000_000);
  console.log("✓ minted 10 USDT");

  // contribute (exercises init_if_needed + boxed accounts on the live program)
  await program.methods.contribute().accountsStrict({
    contributor: me, config, chama, member, owner: me, reputation,
    usdtMint, chmMint, mintAuthority: mintAuth,
    contributorUsdtAta: getAssociatedTokenAddressSync(usdtMint, me),
    contributorChmAta: getAssociatedTokenAddressSync(chmMint, me),
    cycleVault, associatedTokenProgram: ATA_PROGRAM,
    tokenProgram: TOKEN_PROGRAM, systemProgram: anchor.web3.SystemProgram.programId,
  }).rpc();
  console.log("✓ contribute");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chamaAcc = await (program.account as any).chama.fetch(chama);
  const vaultBal = await provider.connection.getTokenAccountBalance(cycleVault);
  console.log("  contributionsThisCycle:", chamaAcc.contributionsThisCycle);
  console.log("  cycle vault balance   :", vaultBal.value.uiAmount, "USDT");
  console.log("\nSMOKE TEST PASSED ✓");
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
