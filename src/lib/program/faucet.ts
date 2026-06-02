import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { USDT_MINT, TOKEN_DECIMALS, FAUCET_AUTHORITY_SECRET } from "./cluster";
import type { AnchorWallet } from "./client";

const usdtMint = new PublicKey(USDT_MINT);

// DEVNET-ONLY mint authority for the mock USDT. The secret is intentionally
// public (see cluster.ts); it can only mint a worthless test token. On mainnet
// FAUCET_AUTHORITY_SECRET is null and the faucet is unavailable, so build the
// keypair lazily and refuse to run without a secret.
function getFaucetAuthority(): Keypair {
  if (FAUCET_AUTHORITY_SECRET === null) {
    throw new Error("Faucet is devnet-only; no faucet authority on this cluster.");
  }
  return Keypair.fromSecretKey(Uint8Array.from(FAUCET_AUTHORITY_SECRET));
}

export async function requestTestUsdt(
  connection: Connection,
  wallet: AnchorWallet,
  amountWhole = 100,
): Promise<string> {
  const faucetAuthority = getFaucetAuthority();
  const owner = wallet.publicKey;
  const dest = getAssociatedTokenAddressSync(usdtMint, owner);
  const baseUnits = BigInt(amountWhole) * 10n ** BigInt(TOKEN_DECIMALS);

  // User owns and pays for the ATA; faucet authority only signs the mint.
  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(owner, dest, owner, usdtMint),
    createMintToInstruction(usdtMint, dest, faucetAuthority.publicKey, baseUnits),
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = owner;
  tx.partialSign(faucetAuthority);
  const signed = await wallet.signTransaction(tx);

  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  return signature;
}

export async function getUsdtBalance(
  connection: Connection,
  owner: PublicKey,
): Promise<number> {
  const dest = getAssociatedTokenAddressSync(usdtMint, owner);
  try {
    const bal = await connection.getTokenAccountBalance(dest);
    return bal.value.uiAmount ?? 0;
  } catch {
    return 0;
  }
}
