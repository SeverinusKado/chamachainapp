import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export function useWalletBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) { setBalance(null); return; }
    let cancelled = false;
    setLoading(true);

    connection.getBalance(publicKey).then((lamports) => {
      if (!cancelled) { setBalance(lamports / LAMPORTS_PER_SOL); setLoading(false); }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    const subId = connection.onAccountChange(publicKey, (info) => {
      setBalance(info.lamports / LAMPORTS_PER_SOL);
    });

    return () => {
      cancelled = true;
      connection.removeAccountChangeListener(subId);
    };
  }, [publicKey, connection]);

  return { balance, loading };
}
