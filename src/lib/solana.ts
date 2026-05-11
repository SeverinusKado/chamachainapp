import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

// Devnet convention: 1 USDC ≈ 0.001 SOL so amounts stay cheap for testing
export const LAMPORTS_PER_USDC = Math.round(0.001 * LAMPORTS_PER_SOL); // 1_000_000

export async function transferSOL(
  connection: Connection,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number,
  sendTransaction: (tx: Transaction, conn: Connection) => Promise<string>,
): Promise<string> {
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey, toPubkey, lamports }),
  );
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = fromPubkey;
  const sig = await sendTransaction(tx, connection);
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

export async function vaultTransfer(
  connection: Connection,
  vault: Keypair,
  toPubkey: PublicKey,
  lamports: number,
): Promise<string> {
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: vault.publicKey, toPubkey, lamports }),
  );
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = vault.publicKey;
  tx.sign(vault);
  const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  return sig;
}

export function explorerUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

export function shortenAddress(addr: string, chars = 4): string {
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export { LAMPORTS_PER_SOL };
