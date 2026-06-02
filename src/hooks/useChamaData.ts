import { useCallback, useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import {
  fetchAllChamas,
  fetchChama,
  fetchReputation,
  type ChamaView,
  type ReputationView,
} from "@/lib/program/accounts";

export function useChamas() {
  const { connection } = useConnection();
  const [chamas, setChamas] = useState<ChamaView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setChamas(await fetchAllChamas(connection));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { chamas, loading, error, refresh };
}

export function useChama(address?: string) {
  const { connection } = useConnection();
  const [chama, setChama] = useState<ChamaView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) {
      setChama(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setChama(await fetchChama(connection, new PublicKey(address)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [connection, address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { chama, loading, error, refresh };
}

export function useReputation(owner?: PublicKey | null) {
  const { connection } = useConnection();
  const [reputation, setReputation] = useState<ReputationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = owner?.toBase58();
  const refresh = useCallback(async () => {
    if (!owner) {
      setReputation(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setReputation(await fetchReputation(connection, owner));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, key]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { reputation, loading, error, refresh };
}
