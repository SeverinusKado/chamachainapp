import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Navbar account button. Once a wallet connects, the login signature is
// requested automatically, so there's no separate "Sign In" button.
const WalletAuthButton: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { authenticated, signIn, signingIn } = useAuth();
  const { toast } = useToast();

  // Track the prompted address so a rejected signature doesn't re-prompt in a loop.
  const promptedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const address = publicKey?.toString() ?? null;
    if (!connected || !address) {
      promptedRef.current = null;
      return;
    }
    if (authenticated || signingIn) return;
    if (promptedRef.current === address) return;

    promptedRef.current = address;
    signIn().catch((err) => {
      toast({
        title: "Sign-in failed",
        description:
          err instanceof Error
            ? err.message
            : "The signature request was rejected.",
        variant: "destructive",
      });
    });
  }, [connected, publicKey, authenticated, signingIn, signIn, toast]);

  return <WalletMultiButton />;
};

export default WalletAuthButton;
