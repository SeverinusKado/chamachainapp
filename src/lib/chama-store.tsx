import React, { createContext, useContext, useState, useCallback } from 'react';
import { Keypair } from '@solana/web3.js';
import { Chama, MOCK_CHAMAS } from './mock-data';

const CHAMA_STORAGE_KEY = 'chamachain_user_chamas';
const VAULT_STORAGE_KEY  = 'chamachain_vault_keys';

type VaultKeyMap = Record<string, number[]>; // chamaId → Uint8Array as number[]

function loadUserChamas(): Chama[] {
  try {
    const raw = localStorage.getItem(CHAMA_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Chama[]) : [];
  } catch { return []; }
}

function loadVaultKeys(): VaultKeyMap {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

interface ChamaStoreContextType {
  chamas: Chama[];
  addChama: (chama: Chama, vaultSecretKey: number[]) => void;
  updateChama: (chamaId: string, updater: (prev: Chama) => Chama) => void;
  getVaultKeypair: (chamaId: string) => Keypair | null;
}

const ChamaStoreContext = createContext<ChamaStoreContextType | null>(null);

export const ChamaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userChamas, setUserChamas] = useState<Chama[]>(loadUserChamas);
  const [vaultKeys]                 = useState<VaultKeyMap>(loadVaultKeys);

  const addChama = useCallback((chama: Chama, vaultSecretKey: number[]) => {
    setUserChamas((prev) => {
      const next = [...prev, chama];
      localStorage.setItem(CHAMA_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    const updated: VaultKeyMap = { ...loadVaultKeys(), [chama.id]: vaultSecretKey };
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const updateChama = useCallback((chamaId: string, updater: (prev: Chama) => Chama) => {
    setUserChamas((prev) => {
      const idx = prev.findIndex((c) => c.id === chamaId);
      if (idx === -1) return prev; // mock chama — not persisted
      const next = [...prev];
      next[idx] = updater(next[idx]);
      localStorage.setItem(CHAMA_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getVaultKeypair = useCallback((chamaId: string): Keypair | null => {
    const keys = loadVaultKeys();
    const secretKey = keys[chamaId];
    if (!secretKey) return null;
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  }, []);

  return (
    <ChamaStoreContext.Provider
      value={{ chamas: [...MOCK_CHAMAS, ...userChamas], addChama, updateChama, getVaultKeypair }}
    >
      {children}
    </ChamaStoreContext.Provider>
  );
};

export function useChamaStore() {
  const ctx = useContext(ChamaStoreContext);
  if (!ctx) throw new Error('useChamaStore must be used within ChamaProvider');
  return ctx;
}
