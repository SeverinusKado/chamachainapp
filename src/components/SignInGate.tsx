import React from "react";
import { Wallet, PenLine } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Full-page gate for routes that need a signed-in wallet. `action` fills the
// sentence "… to {action}", e.g. "view your chamas".
const SignInGate: React.FC<{ action: string }> = ({ action }) => {
  const { connected } = useWallet();
  const { signIn, signingIn } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (err) {
      toast({
        title: "Sign-in failed",
        description:
          err instanceof Error
            ? err.message
            : "The signature request was rejected.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 text-center">
        <Wallet className="w-12 h-12 text-cool-steel mx-auto mb-4" />
        <h2 className="text-xl font-bold text-pale-sky mb-2">
          {connected ? "Sign In Required" : "Wallet Not Connected"}
        </h2>
        <p className="text-cool-steel text-sm mb-6">
          {connected
            ? `Sign a message with your wallet to ${action}.`
            : `Connect your wallet to ${action}.`}
        </p>
        <div className="flex justify-center">
          {connected ? (
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <PenLine className="w-4 h-4" />
              {signingIn ? "Check your wallet…" : "Sign In"}
            </button>
          ) : (
            <WalletMultiButton />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SignInGate;
