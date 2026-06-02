import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";

// A connected wallet isn't proof of ownership (browsers auto-reconnect approved
// wallets), so we require a signed login message and remember it for the tab.
type AuthState = {
  authenticated: boolean;
  signingIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_PREFIX = "chamachain.auth.";

function buildLoginMessage(address: string, nonce: string): string {
  return [
    "Sign in to ChamaChain",
    "",
    "Approve this signature to prove you own this wallet.",
    "This request will not trigger a transaction or cost any fees.",
    "",
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { publicKey, connected, signMessage, disconnect } = useWallet();
  const address = publicKey?.toString() ?? null;

  const [authedAddress, setAuthedAddress] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // Restore a prior session when the active wallet changes.
  useEffect(() => {
    if (!address) {
      setAuthedAddress(null);
      return;
    }
    const saved = sessionStorage.getItem(STORAGE_PREFIX + address);
    setAuthedAddress(saved ? address : null);
  }, [address]);

  useEffect(() => {
    if (!connected) setAuthedAddress(null);
  }, [connected]);

  const signIn = useCallback(async () => {
    if (!publicKey) throw new Error("Connect a wallet first.");
    if (!signMessage) {
      throw new Error("This wallet does not support message signing.");
    }
    setSigningIn(true);
    try {
      const addr = publicKey.toString();
      const nonce = crypto.randomUUID();
      const message = buildLoginMessage(addr, nonce);
      const signature = await signMessage(new TextEncoder().encode(message));
      const token = btoa(String.fromCharCode(...signature));
      sessionStorage.setItem(STORAGE_PREFIX + addr, token);
      setAuthedAddress(addr);
    } finally {
      setSigningIn(false);
    }
  }, [publicKey, signMessage]);

  const signOut = useCallback(() => {
    if (address) sessionStorage.removeItem(STORAGE_PREFIX + address);
    setAuthedAddress(null);
    void disconnect();
  }, [address, disconnect]);

  const value = useMemo<AuthState>(
    () => ({
      authenticated: !!address && authedAddress === address,
      signingIn,
      signIn,
      signOut,
    }),
    [address, authedAddress, signingIn, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
